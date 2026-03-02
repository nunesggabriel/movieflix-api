import express from 'express';
import { PrismaClient } from "@prisma/client";
import console = require('node:console');
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json';


const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


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

app.put("/movies/:id", async (req, res) => {
  
  const id = Number(req.params.id);

  try{
  const movie = await prisma.movie.findUnique({
    where: { id },
  });
  if (!movie) {return res.status(404).send({ message: "Filme não encontrado" });
}

  const data= {...req.body};
  data.release_date = data.release_date ? new Date(data.release_date) : undefined;

  await prisma.movie.update({
    where: { id },
    data: data,
  });
  }catch (error) {
return res.status(500).send({ message: "Erro ao atualizar o filme" });
  }

  res.status(200).send();


});

app.delete("/movies/:id", async (req, res) => {
  
  const id = Number(req.params.id);

  try {
  const movie = await prisma.movie.findUnique({where: { id }});
  if (!movie) {
    return res.status(404).send({ message: "Filme não encontrado" });
  }

  await prisma.movie.delete({
    where: { id },
  }); }catch (error) {
    return res.status(500).send({ message: "Erro ao deletar o filme" });
  }
  
  res.status(200).send();

});

app.get("/movies/:genreName", async (req, res) => {

  try {
  const moviesFilteredByGenreName = await prisma.movie.findMany({
    include: {  // utilizado para incluir o nome do genres e languages ao invés de apenas id
      genres: true,
      languages: true,
    },
    where: {
      genres: {
        name: {
          equals: req.params.genreName,
          mode: "insensitive" // necessário para trazer Drama e drama, por exemplo, removendo o case sensitivity
        }
     
      }
    }
  });
    res.status(200).send(moviesFilteredByGenreName);
}catch (error) {
  return res.status(500).send({ message: "Erro ao buscar os filmes por gênero" });
}
});


app.listen(port, () => {
  console.log(`Servidor em execução http://localhost:${port}`);
});