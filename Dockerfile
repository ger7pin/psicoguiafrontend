# Etapa de build
FROM node:18-slim AS builder

# Establece el directorio de trabajo
WORKDIR /app

# Copia e instala dependencias
COPY package*.json ./
RUN npm install

# Copia el resto del proyecto
COPY . .

# Compila el proyecto Next.js
RUN npm run build


# Etapa de producción
FROM node:18-slim AS production

WORKDIR /app

# Copia desde la etapa anterior solo lo necesario
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]


# Etapa de desarrollo opcional
FROM node:18-slim AS development

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
