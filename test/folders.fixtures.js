function makeFoldersArray() {
    return [
        {
            id: 1,
            name: "Great Folder"
        },
        {   
            id: 2,
            name: "Better Folder"
        },
        {
            id: 3,
            name: "The Best Folder"
        }
    ]
}

function makeMaliciousFolder() {
    const maliciousFolder = {
        id: 911,
        name: 'Naughty naughty very naughty <script>alert("xss");</script>',
    }
    const expectedFolder = {
        id: 911,
        name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    }
    return {
        maliciousFolder,
        expectedFolder
    }
}

module.exports = {
    makeFoldersArray,
    makeMaliciousFolder
}