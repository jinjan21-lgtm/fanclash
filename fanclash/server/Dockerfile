FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE ${PORT:-3001}

CMD ["npx", "tsx", "index.ts"]
