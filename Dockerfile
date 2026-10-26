FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_POSTHOG_PROJECT_TOKEN
ARG VITE_POSTHOG_HOST
ENV VITE_POSTHOG_PROJECT_TOKEN=$VITE_POSTHOG_PROJECT_TOKEN
ENV VITE_POSTHOG_HOST=$VITE_POSTHOG_HOST
RUN npm run build

FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY server ./server
COPY src/resources.ts ./src/resources.ts
EXPOSE 4173
CMD ["npm", "run", "start"]
