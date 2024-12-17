"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "new",
        salary: 1,
        equity: "0.0",
        companyHandle: "c1"
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual(newJob);

        const result = await db.query(
            `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'new'`);
        expect(result.rows).toEqual([
            {
                title: "new",
                salary: 1,
                equity: "0.0",
                companyHandle: "c1"
            },
        ]);
    });

    test("bad request with dupe", async function () {
        try {
            await Job.create(newJob);
            await Job.create(newJob);
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** findAll */

describe("findAll", function () {
    test("works", async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                title: "j1",
                salary: 1,
                equity: "0.0",
                companyHandle: "c1"
            },
            {
                title: "j2",
                salary: 2,
                equity: "0.0",
                companyHandle: "c2"
            },
            {
                title: "j3",
                salary: 3,
                equity: "0.0",
                companyHandle: "c3"
            },
        ]);
    });
});

/************************************** get */

describe("get", function () {
    test("works", async function () {
        let job = await Job.get("j1");
        expect(job).toEqual({
            title: "j1",
            salary: 1,
            equity: "0.0",
            companyHandle: "c1"
        });
    });

    test("not found if no such job", async function () {
        try {
            await Job.get("nope");
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function () {
    const updateData = {
        salary: 10,
        equity: "0.5",
    };

    test("works", async function () {
        let job = await Job.update("j1", updateData);
        expect(job).toEqual({
            title: "j1",
            ...updateData,
            companyHandle: "c1"
        });

        const result = await db.query(
            `SELECT title, salary, equity, company_handle AS "companyHandle"
             FROM jobs
             WHERE title = 'j1'`);
        expect(result.rows).toEqual([{
            title: "j1",
            salary: 10,
            equity: "0.5",
            companyHandle: "c1",
        }]);
    });

    test("works: null fields", async function () {
        const updateDataSetNulls = {
            salary: null,
            equity: null,
        };

        let job = await Job.update("j1", updateDataSetNulls);
        expect(job).toEqual({
            title: "j1",
            ...updateDataSetNulls,
            companyHandle: "c1"
        });

        const result = await db.query(
            `SELECT title, salary, equity, company_handle AS "companyHandle"
             FROM jobs
             WHERE title = 'j1'`);
        expect(result.rows).toEqual([{
            title: "j1",
            salary: null,
            equity: null,
            companyHandle: "c1"
        }]);
    });

    test("not found if no such company", async function () {
        try {
            await Job.update("nope", updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {
        try {
            await Job.update("j1", {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
        await Job.remove("j1");
        const res = await db.query(
            "SELECT title FROM jobs WHERE title='j1'");
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such company", async function () {
        try {
            await Job.remove("nope");
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});