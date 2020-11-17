const knex = require('knex')
const app = require('../src/app')
const { makeFoldersArray, makeMaliciousFolder } = require('./folders.fixtures')


let db

before('make knex instance', () => {
    db = knex({
    client: 'pg',
    connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
})

after('disconnect from db', () => db.destroy())

before('clean the table', () => db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'))

afterEach('cleanup',() => db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'))

describe(`GET /api/folders`, () => {
    context(`Given no folders`, () => {
        it(`responds with 200 and an empty list`, () => {
            return supertest(app)
            .get('/api/folders')
            .expect(200, [])
        })
    })  

    context('Given there are folders in the database', () => {
        const testFolders = makeFoldersArray()
  
        beforeEach('insert folders', () => {
          return db
            .into('folders')
            .insert(testFolders)
        })
  
        it('responds with 200 and all of the folders', () => {
          return supertest(app)
            .get('/api/folders')
            .expect(200, testFolders)
        })
      })
  
      context(`Given an XSS attack article`, () => {
        const { maliciousFolder, expectedFolder } = makeMaliciousFolder()
  
        beforeEach('insert malicious article', () => {
          return db
            .into('folders')
            .insert([ maliciousFolder ])
        })

        it('removes XSS attack content', () => {
            return supertest(app)
              .get(`/api/folders`)
              .expect(200)
              .expect(res => {
                expect(res.body[0].name).to.eql(expectedFolder.name)
              })
        })
    })  
})

describe(`POST /api/folders`, () => {
    it(`creates a folder, responding with 201 and the new folder`, function() {
      const newFolder = {
        name: 'Test new folder',
      }
      return supertest(app)
        .post('/api/folders')
        .send(newFolder)
        .expect(201)
        .expect(res => {
          expect(res.body.name).to.eql(newFolder.name)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`)
        })
        .then(res =>
          supertest(app)
            .get(`/api/folders/${res.body.id}`)
            .expect(res.body)
        )
    })

    const requiredFields = ['name']

    requiredFields.forEach(field => {
      const newFolder = {
        name: 'Test new article',
      }

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newFolder[field]

        return supertest(app)
          .post('/api/folders')
          .send(newFolder)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` }
          })
      })
    })

    it('removes XSS attack content from response', () => {
      const { maliciousFolder, expectedFolder } = makeMaliciousFolder()
      return supertest(app)
        .post(`/api/folders`)
        .send(maliciousFolder)
        .expect(201)
        .expect(res => {
          expect(res.body.name).to.eql(expectedFolder.name)
        })
            
    })
})

describe(`GET /api/folders/:folder_id`, () => {
    context(`Given no folders`, () => {
      it(`responds with 404`, () => {
        const folderId = 123456
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(404, { error: { message: `Folder doesn't exist` } })
      })
    })

    context('Given there are folders in the database', () => {
      const testFolders = makeFoldersArray()

      beforeEach('insert folders', () => {
        return db
          .into('folders')
          .insert(testFolders)
      })

      it('responds with 200 and the specified article', () => {
        const folderId = 2
        const expectedFolder = testFolders[folderId - 1]
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(200, expectedFolder)
      })
    })

    context(`Given an XSS attack folder`, () => {
      const { maliciousFolder, expectedFolder } = makeMaliciousFolder()

      beforeEach('insert malicious folder', () => {
        return db
          .into('folders')
          .insert([ maliciousFolder ])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/folders/${maliciousFolder.id}`)
          .expect(200)
          .expect(res => {
            expect(res.body.name).to.eql(expectedFolder.name)
          })
      })
    })
})

describe(`PATCH /api/folders/:folder_id`, () => {
    context(`Given no folders`, () => {
      it(`responds with 404`, () => {
        const folderId = 123456
        return supertest(app)
          .patch(`/api/folders/${folderId}`)
          .expect(404, { error: { message: `Folder doesn't exist` } })
      })
    })
  
    context(`Given there are folders in the database`, () => {
      const testFolders = makeFoldersArray()
  
      beforeEach('insert folders', () => {
        return db
          .into('folders')
          .insert(testFolders)
      })
  
      it('responds with 204 and updates the folders', () => {
        const idToUpdate = 2
        const updateFolder = {
          name: 'updated folder name',
        }
        const expectedFolder = {
          ...testFolders[idToUpdate - 1],
          ...updateFolder
        }
        return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .send(updateFolder)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/folders/${idToUpdate}`)
              .expect(expectedFolder)
          )
      })

      it(`responds with 400 when no required fields supplied`,() => {
        const idToUpdate = 2
        return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: { message: `Request must contain a 'name' to update`}
          })
      })
    })
})