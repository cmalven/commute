# Commute

A simple command-line tool for syncing development database.

---

## Install

```
npm install -g commute

OR

npm link -g (from within this repo locally)
```

## Setup

Commute expects to find a YAML file at `~/.commute.yml` that defines the connection settings for each project.

```yaml
my-project:
  remote:
    host: 123.456.789.1234
    secure: true
    u: myuser
    db:
      name: remote-db-name
      u: dbuser
      p: dbpass

  local:
    db:
      name: local-db-name
```

## Use

Run commute out of any project directory:

```
commute <project> <operation>
```

`project`: The name of the project to work with, should match a top-level key in `~/.commute.yml`

`operation`: Should be one of `down`, or `dump`

## Operations

### down

Creates a dump of the remote database and imports it into the local database.

### dump

Creates a dump of the remote database and saves it locally without importing.
