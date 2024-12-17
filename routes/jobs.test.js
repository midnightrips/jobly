"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        title: "new",
        salary: 1,
        equity: 0.0,
        companyHandle: "c1"
    };

    test("ok for users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                title: "new",
                salary: 1,
                equity: "0",
                companyHandle: "c1"
            }
        });
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "new",
                salary: 10
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "new",
                salary: "100",
                equity: "0.0",
                companyHandle: "c1"
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        title: "j1",
                        salary: 1,
                        equity: "0",
                        companyHandle: "c1",
                    },
                    {
                        title: "j2",
                        salary: 2,
                        equity: "0",
                        companyHandle: "c3",
                    },
                    {
                        title: "j3",
                        salary: 3,
                        equity: "0",
                        companyHandle: "c3",
                    },
                ],
        });
    });

    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app)
            .get("/jobs")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(500);
    });
});

/************************************** GET /jobs/:title */

describe("GET /jobs/:title", function () {
    test("works for anon", async function () {
        const resp = await request(app).get(`/jobs/j1`);
        expect(resp.body).toEqual({
            job: {
                title: "j1",
                salary: 1,
                equity: "0",
                companyHandle: "c1",
            },
        });
    });

    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/nope`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs/:title */

describe("PATCH /jobs/:title", function () {
    test("works for users", async function () {
        const resp = await request(app)
            .patch(`/jobs/j1`)
            .send({
                title: "j1-new",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({
            job: {
                title: "j1-new",
                salary: 1,
                equity: "0",
                companyHandle: "c1",
            },
        });
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .patch(`/jobs/j1`)
            .send({
                title: "j1-new",
            });
        expect(resp.statusCode).toEqual(401);
    });

    test("not found on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/nope`)
            .send({
                title: "new nope",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on company_handle change attempt", async function () {
        const resp = await request(app)
            .patch(`/jobs/j1`)
            .send({
                companyHandle: "c1-new",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /jobs/:title */

describe("DELETE /jobs/:title", function () {
    test("works for users", async function () {
        const resp = await request(app)
            .delete(`/jobs/j1`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({ deleted: "j1" });
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .delete(`/jobs/j1`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such job", async function () {
        const resp = await request(app)
            .delete(`/jobs/nope`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});