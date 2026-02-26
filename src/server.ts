import express from 'express';
import { PrismaClient } from "@prisma/client";
import console = require('node:console');


const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());


app.get('/movies', async (_, res) => {
  const movies = await prisma.movie.findMany({
    orderBy: {
      title: "asc",
          },
          include: {
            genres: true,
            languages: true,
          },
        });
  res.json(movies);
});

app.post("/movies", async (req, res) => {

  const { title, genre_id, language_id, oscar_count, release_date } = req.body;

  try {

    // verificar se não há registro igual já inserido no banco de dados
    const movieWithSameTitle = await prisma.movie.findFirst({
      where: { title: { equals: title, mode: "insensitive" } },
    });
    if (movieWithSameTitle) {
      return res.status(409).send({ message: "Filme com o mesmo título já existe" });
    }

  await prisma.movie.create({
    data: {
     title,
     genre_id,
     language_id,
     oscar_count,
     release_date: new Date(release_date)
  }
});
}catch (error) {
  return res.status(500).json({ message: "Erro ao criar o filme" });
}

res.status(201).send();
});


app.listen(port, () => {
  console.log(`Servidor em execução http://localhost:${port}`);
});