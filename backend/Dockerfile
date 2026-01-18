FROM node:20-alpine

WORKDIR /app

# Install dependencies needed for downloading & extracting
RUN apk add --no-cache curl tar

# ✅ Install D2 binary
RUN curl -L https://github.com/terrastruct/d2/releases/download/v0.7.1/d2-v0.7.1-linux-amd64.tar.gz \
  -o d2.tar.gz && \
  tar -xzf d2.tar.gz && \
  mv d2-v0.7.1/bin/d2 /usr/local/bin/d2 && \
  chmod +x /usr/local/bin/d2 && \
  rm -rf d2.tar.gz d2-v0.7.1

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000
CMD ["npm", "run", "dev"]
