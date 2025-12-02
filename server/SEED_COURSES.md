# Seed courses (short)

Quick instructions to insert mock courses into MongoDB for local development.

Files:
- Script: `server/src/scripts/seedCourses.ts`
- NPM script: `npm run seed:courses`

Notes:
- The script clears the `courses` collection and inserts 3 sample courses.
- It uses `MONGODB_URI` from the environment or defaults to `mongodb://localhost:27017/roads-to-rome`.

Run (PowerShell):

```powershell
cd C:\Users\PC\Documents\folder_code_of_PH\AWAD\G03\Roads-to-Rome\server
npm run seed:courses
```

Verify:
- curl http://localhost:3000/api/courses
- or open the `courses` collection in MongoDB Compass / shell.

To keep existing data, remove the `Course.deleteMany({})` line in the seed script.

Only run this on dev/test environments.
