# Gator

Gator is a command-line RSS aggregator. You register a user, add feeds, and leave `agg` running. It downloads each feed in turn, saves the posts, and `browse` shows the latest ones for the logged-in user.

## Requirements

- Node.js 22
- PostgreSQL
- npm

## Setup

Install the dependencies from the project root:

```bash
npm install
```

Create `~/.gatorconfig.json` in your home directory. Gator reads the database URL from this file and stores the name of the logged-in user there.

```json
{
  "db_url": "postgres://USER:PASSWORD@localhost:5432/gator",
  "current_user_name": ""
}
```

Create the `gator` database in PostgreSQL, then apply the migrations from the project root:

```bash
npm run migrate
```

Run every command from that same directory:

```bash
npm run start <command>
```

## Commands

Create a user and log in. `register` also sets that user as the current one.

```bash
npm run start register lane
npm run start login lane
npm run start users
```

`users` prints every user. The logged-in name is marked with `(current)`.

Add a feed. This saves the feed and follows it for the current user. `feeds` lists every feed in the database. `following` lists only the feeds the current user follows.

```bash
npm run start addfeed "TechCrunch" "https://techcrunch.com/feed/"
npm run start addfeed "Hacker News" "https://news.ycombinator.com/rss"
npm run start feeds
npm run start following
```

Follow or unfollow a feed that is already stored. The argument is the feed URL.

```bash
npm run start follow "https://techcrunch.com/feed/"
npm run start unfollow "https://techcrunch.com/feed/"
```

`agg` fetches feeds in a loop. The argument is how long to wait between requests: `ms`, `s`, `m`, or `h`. Use at least `1m` so the servers you fetch are not hit too often. Press Ctrl+C to stop.

```bash
npm run start agg 1m
```

`browse` prints posts from the feeds the current user follows, newest first. With no number it prints 2 posts.

```bash
npm run start browse
npm run start browse 5
```

`reset` deletes the users. Feeds, follows, and posts that belong to those users are removed with them.

```bash
npm run start reset
```

`addfeed`, `follow`, `following`, `unfollow`, and `browse` need a logged-in user. Run `register` or `login` first.
