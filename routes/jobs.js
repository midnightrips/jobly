"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdminOrCorrectUser } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();


/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login, is_admin
 */

router.post("/", [ensureLoggedIn, ensureAdminOrCorrectUser], async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

/** GET /  =>
 *   { jobs: [ { title, salary, equity, companyHandle }, ...] }
 *
 * filter:
 *      title: filter by job title. case-insensitive, matches-any-part-of-string search
 *      minSalary: filter to jobs with at least that salary
 *      hasEquity: if true, filter jobs that provide a non-zero amount of equity. If false or not included, list all jobs regardless of equity.
 * 
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
    try {
        // Define allowed filter keys
        const allowedFilters = ["title", "minSalary", "hasEquity"];
        const filters = req.query;

        // Ensure filters are a plain object
        if (typeof filters !== "object" || Array.isArray(filters)) {
            throw new BadRequestError("Invalid query parameters format");
        }

        // Validate filters for allowed keys
        const invalidFilters = Object.keys(filters).filter(
            (key) => !allowedFilters.includes(key)
        );
        if (invalidFilters.length > 0) {
            throw new BadRequestError(
                `Invalid filters: ${invalidFilters.join(", ")}. Allowed filters are: ${allowedFilters.join(", ")}`
            );
        }

        // Validate and sanitize filter inputs
        const { title, minSalary, hasEquity } = filters;

        if (minSalary !== undefined && isNaN(+minSalary)) {
            throw new BadRequestError("minSalary must be a valid number");
        }

        if (hasEquity !== undefined && !(hasEquity === "true" || hasEquity === "false")) {
            throw new BadRequestError("hasEquity must be 'true' or 'false'");
        }

        // Convert and sanitize filter inputs
        const sanitizedFilters = {};
        if (title) sanitizedFilters.title = title;
        if (minSalary !== undefined) sanitizedFilters.minSalary = +minSalary;
        if (hasEquity === "true") sanitizedFilters.hasEquity = true;

        // Call the model method with validated inputs
        const jobs = await Job.findAll(sanitizedFilters);

        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
});

/** GET /[title]  =>  { job }
 *
 *  Job is { title, salary, equity, companyHandle }
 *
 * Authorization required: none
 */

router.get("/:title", async function (req, res, next) {
    try {
        const job = await Job.get(req.params.title);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[title] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { salary, equity }
 *
 * Returns { title, salary, equity, companyHandle }
 *
 * Authorization required: login, is_admin
 */

router.patch("/:title", [ensureLoggedIn, ensureAdminOrCorrectUser], async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.update(req.params.title, req.body);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[title]  =>  { deleted: title }
 *
 * Authorization: login, is_admin
 */

router.delete("/:title", [ensureLoggedIn, ensureAdminOrCorrectUser], async function (req, res, next) {
    try {
        await Job.remove(req.params.title);
        return res.json({ deleted: req.params.title });
    } catch (err) {
        return next(err);
    }
});


module.exports = router;
