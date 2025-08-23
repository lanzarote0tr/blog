## Getting Started

### Prerequisites
```
Docker
```

### Write .env file on project root
```env
MYSQL_ROOT_PASSWORD=
NODE_ENV=production
PORT=3000
DB_PORT=3306
DB_USER=
DB_PASSWORD=
SESSION_SECRET=
```

### How to start the server
```sh
docker compose up
```

### How to delete docker instance
```sh
docker compose down -rmi all --volumes --remove-orphans
```

## Features

### Blogger

1. Create Post
2. View Post -- No Auth
3. Update Post
4. Delete Post


### Planner
