const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", () => {
    test("should generate correct SQL and values for valid input", () => {
        const dataToUpdate = { firstName: 'Aliya', age: 32 };
        const jsToSql = { firstName: "first_name" };

        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

        expect(result).toEqual({
            setCols: '"first_name"=$1, "age"=$2',
            values: ['Aliya', 32],
        });
    });

    test("should use the JavaScript field name if no mapping exists in jsToSql", () => {
        const dataToUpdate = { city: 'New York', country: 'USA' };
        const jsToSql = {};

        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

        expect(result).toEqual({
            setCols: '"city"=$1, "country"=$2',
            values: ['New York', 'USA'],
        });
    });

    test("should throw BadRequestError if dataToUpdate is empty", () => {
        const dataToUpdate = {};
        const jsToSql = { firstName: "first_name" };

        expect(() => sqlForPartialUpdate(dataToUpdate, jsToSql))
            .toThrow(BadRequestError);
    });
});
