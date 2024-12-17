"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdminOrCorrectUser } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

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
    const validator = jsonschema.validate(req.body, companyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    const allowedFilters = ["nameLike", "minEmployees", "maxEmployees"];
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

    // Validate minEmployees and maxEmployees logic
    const { minEmployees, maxEmployees } = filters;
    if (minEmployees !== undefined && maxEmployees !== undefined && +minEmployees > +maxEmployees) {
      throw new BadRequestError("minEmployees cannot be greater than maxEmployees");
    }

    // Call the model method with validated and sanitized inputs
    const companies = await Company.findAll({
      name: filters.nameLike,
      minEmployees: minEmployees !== undefined ? +minEmployees : undefined,
      maxEmployees: maxEmployees !== undefined ? +maxEmployees : undefined,
    });

    return res.json({ companies });
  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login, is_admin
 */

router.patch("/:handle", [ensureLoggedIn, ensureAdminOrCorrectUser], async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login, is_admin
 */

router.delete("/:handle", [ensureLoggedIn, ensureAdminOrCorrectUser], async function (req, res, next) {
  try {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
