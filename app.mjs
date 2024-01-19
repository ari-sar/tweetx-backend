import express from 'express';
import bodyParser from 'body-parser';
import { JSONFilePreset } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

const defaultData = { users: [], posts: [] }
const db = await JSONFilePreset('db.json', defaultData)

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

// ? Users Crud
app.get('/users', (req, res) => {
  res.send(db.data.users)
});

app.get('/users/:email', (req, res) => {
  const userEmail = req.params.email;
  const user = getUserByEmail(userEmail);

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

const getUserByEmail = (email) => {
  const { users } = db.data;
  const user = users.find((u) => u.email === email)
  return user;
};

app.get('/details', (req, res) => {
  const userIds = req.query.ids;
  const users = db.data.users;
  const userIdsArray = userIds.split(',');
  let newItems = [];
  console.log(userIdsArray, 'userIdsArray')
  userIdsArray.map(id => {
    const user = users.filter(u => u.userId === id);
    console.log(user[0], 'User')
    newItems.push(user[0]);
  })
  if (newItems.length > 0) {
    res.status(201).json(newItems);
  } else {
    res.status(404).json({ error: 'User with ids not found' });
  }
});

app.post('/users', (req, res) => {
  const userId = uuidv4();
  const newItem = req.body;
  // console.log(newItem,'User')
  newItem.userId = userId;
  if (db.data.users) {
    db.update(({ users }) => { users.push(newItem) })
  } else {
    db.data = { users: [] };
    db.write();
    db.update(({ users }) => { users.push(newItem) })
  }
  res.status(201).json(newItem);
});

app.post('/users/follow', (req, res) => {
  const followerId = req.body.userId;//Ari
  const followingId = req.body.followingUserId;//Ankita
  const users = db.data.users;
  const follower = users.find(u => u.userId === followerId); // Ari
  const following = users.find(u => u.userId === followingId); //Ankita

  // console.log(follower,following)
  follower.following.push(followingId);
  following.followers.push(followerId);
  db.update(({ users }) => { users = users })
  res.status(201).json(users);
});

//? Posts Crud

app.post('/posts', (req, res) => {
  const postId = uuidv4();
  const newItem = req.body;
  newItem.postId = postId;
  if (db.data.posts) {
    db.update(({ posts }) => { posts.push(newItem) })
  } else {
    db.data = { ...db.data, posts: [] };
    db.write();
    db.update(({ posts }) => { posts.push(newItem) })
  }
  res.status(201).json(newItem);
});

app.get('/posts', (req, res) => {
  const posts = db.data.posts;
  const userId = req.query.userId;
  let newPosts = [];
  if (posts && posts.length > 0) {
    if (req.query.following) {
      const followingIds = req.query.following;
      const followingIdsArray = followingIds.split(',');
      console.log(followingIdsArray)
      followingIdsArray.map((id => {
        posts.map(post => {
          if (post.userId === id) {
            newPosts.push(post)
          }
        })
      }))
      posts.map(post => {
        if (post.userId === userId) {
          newPosts.push(post)
        }
      })
    } else {
      posts.map(post => {
        if (post.userId === userId) {
          newPosts.push(post)
        }
      })
    }
  } else {
    db.data = { ...db.data, posts: [] };
    db.write();
    newPosts = [];
  }
  newPosts.sort((a, b) => b.time - a.time);
  res.send(newPosts);
  res.status(200);
})







app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
