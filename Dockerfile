FROM node:14
WORKDIR /app
COPY package.json /app
RUN yarn install
COPY . /app
CMD nodemon main.js
EXPOSE 1337