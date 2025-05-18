### How to use template.env to make .env file

The format in template.env is: 

```
# PostgreSQL Configuration
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=

# Redis Configuration
REDIS_PASSWORD=
```

1. Make an .env file in the folder where the template.env and copy the field from template.env to the make env file
2. then do `docker compose up -d` to start the docker container

