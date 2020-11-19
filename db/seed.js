
const { 
    client,
    getAllUsers,
    createUser,
    updateUser, 
    createPost, 
    getUserById, 
    getAllPosts, 
    updatePost,
    getPostsByUser,
    addTagsToPost
    } = require('./index');

const createInitialUsers = async () => {

    try {
        console.log("Starting to create users...");

        const albert = await createUser({ username: 'albert', password: 'bertie99', location: 'NYC, NY', name: 'Big Al', active: true });
        const sandra = await createUser({ username: 'sandra', password: '2sandy4me', location: 'Savanna, GA', name: 'Just Sandra', active: true});
        const glamgal = await createUser({ username: 'glamgal', password: 'soglam', location: 'Las Vegas, NV', name: 'Joshua', active: true})


        console.log("Finished creating users!");
    } catch(error) {
        console.error("Error creating users!");
        throw error;
  }
}

const createInitialPosts = async () => {

    try {
        const [ albert, sandra, glamgal ] = await getAllUsers();

        await createPost({
            authorId: albert.id,
            title: "First Post",
            content: "This is my first post. I hope I love writing blogs as much as I love writing them"
        });

        await createPost({
            authorId: sandra.id,
            title: "How does this work?",
            content: "Seriously, does this even do anything?"
          });
      
          await createPost({
            authorId: glamgal.id,
            title: "Living the Glam Life",
            content: "Do you even? I swear that half of you are posing."
          });

    } catch (error) {
        throw error;
    }
}

 const createInitialTags = async () => {
    try {
      console.log("Starting to create tags...");
  
      const [happy, sad, inspo, catman] = await createTags([
        '#happy', 
        '#worst-day-ever', 
        '#youcandoanything',
        '#catmandoeverything'
      ]);
  
      const [postOne, postTwo, postThree] = await getAllPosts();
  
      await addTagsToPost(postOne.id, [happy, inspo]);
      await addTagsToPost(postTwo.id, [sad, inspo]);
      await addTagsToPost(postThree.id, [happy, catman, inspo]);
  
      console.log("Finished creating tags!");
    } catch (error) {
      console.log("Error creating tags!");
      throw error;
    }
  }

const dropTables = async () => {

    try {
        console.log("Starting to drop tables...")

        await client.query(`
            DROP TABLE IF EXISTS post_tags;
            DROP TABLE IF EXISTS tags;
            DROP TABLE IF EXISTS posts;
            DROP TABLE IF EXISTS users;
        `);
        console.log("Dropped tables like they were hot!")
    } catch (error) { 
        console.error("Error dropping tables!")
        throw(error);
    }

}

const createTables = async () => {

    try {
        console.log("Starting to build tables...")

        await client.query(`
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            location VARCHAR(255) NOT NULL,
            active BOOLEAN DEFAULT true
            );
        `);

        await client.query(`
        CREATE TABLE posts(
            id SERIAL PRIMARY KEY,
            "authorId" INTEGER REFERENCES users(id) NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            active BOOLEAN DEFAULT true
        );
        `);

        await client.query(`
            CREATE TABLE tags(
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL
            )
        `);

        await client.query(`
                CREATE TABLE post_tags(
                    "postId" INTEGER REFERENCES posts(id),
                    "tagId" INTEGER REFERENCES tags(id) ,
                    UNIQUE ("postId", "tagId")
                )
        `)

        console.log("Built tables like a master carpenter!")
    } catch (error) {
        console.error("Error building tables!")
        throw error;
    }

}

const createTags = async (tagList) => {

    if (tagList.length === 0) {
        return;
    }

    const insertValues = tagList.map((_, index)=> `$${index + 1}`).join('), (');
    
    const selectValues = tagList.map((_, index)=> `$${index + 1}`).join(', ');
    // insert the tags, doing nothing on conflict
    // returning nothing, we'll query after

    // select all tags where the name is in our taglist
    // return the rows from the query

    try {
        await client.query(`
            INSERT INTO tags(name)
            VALUES (${insertValues})
            ON CONFLICT (name) DO NOTHING;
        `, tagList);

        const { rows } = await client.query(`
            SELECT * FROM tags
            WHERE name
            IN (${selectValues});
        `, tagList);
        // console.log(rows);
        return rows

    } catch (error) {
        throw error;
    }

}




const rebuildDB = async () => {

    try {
        client.connect();

       await dropTables();
       await createTables();
       await createInitialUsers();
       await createInitialPosts();
       await createInitialTags();
       
    } catch (error) {
        console.log("Error during rebuildDB")
        throw error;
    } 

}

const testDB = async () => {
    try {
        console.log("Starting to test database...");

    console.log("Calling getAllUsers");
    const users = await getAllUsers();
    console.log("Results:", users);

    console.log("Calling updateUser on users[0]")
    const udpateUserResult = await updateUser(users[0].id, {
        name: "Albie",
        location: "Lesterville, KY"
    });
    console.log("Result:", udpateUserResult);

    console.log("Calling getAllPosts");
    const posts = await getAllPosts();
    console.log("Result:", posts);

    console.log("Calling updatePost on posts[0]");
    const updatePostResult = await updatePost(posts[0].id, {
      title: "New Title",
      content: "Updated Content"
    });
    console.log("Result:", updatePostResult);

    console.log("Calling getUserById with 1");
    const albert = await getUserById(1);
    console.log("Result:", albert);

    console.log("Finished database tests!");
    } catch (error) {
        console.error("Error testing database!");
        throw error;
    } 
}

rebuildDB()
    .then(testDB)
    .catch(console.error)
    .finally(()=> client.end());