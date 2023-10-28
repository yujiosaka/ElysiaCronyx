FROM oven/bun:latest

# Set the working directory
WORKDIR /app

# Install Git
RUN apt-get update && apt-get install -y curl git

# Initialize an empty Git repository
# for preventing Husky install to fail
RUN git init

COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

COPY . .

# Run unit tests
CMD ["bun", "test"]
