const express = require("express");

const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

let db = null;

const initializeDbAndSever = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndSever();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertDbObjectToResponseObject1 = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//Get Players API

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
        SELECT
          *
        FROM
          player_details;`;

  const getPlayerResponse = await db.all(getPlayersQuery);
  response.send(
    getPlayerResponse.map((eachPlayer) => {
      return convertDbObjectToResponseObject(eachPlayer);
    })
  );
});

//Get Players API

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerQuery = `
        SELECT
          *
        FROM
          player_details
        WHERE
          player_id = ${playerId};`;
  const getPlayerResponse = await db.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject(getPlayerResponse));
});

//Update Player Details API

app.put("/players/:playerId/", (request, response) => {
  const { playerId } = request.params;

  const playerDetails = request.body;
  const { playerName } = playerDetails;

  const updatePlayerQuery = `
    UPDATE
      player_details
    SET
      player_name = "${playerName}"
    WHERE
      player_id = ${playerId};`;

  db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Get Match Details Of Specific Match API

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const getMatchDetailsQuery = `
        SELECT
          *
        FROM
          match_details
        WHERE
          match_id = ${matchId};`;

  const getMatchDetailsResponse = await db.get(getMatchDetailsQuery);
  response.send(convertDbObjectToResponseObject1(getMatchDetailsResponse));
});

// Return Matches Of Players API

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;

  const getMatchesOfPlayersQuery = `
        SELECT
          match_id AS matchId,
          match AS match,
          year AS year
        FROM
          match_details
          NATURAL JOIN player_match_score
        WHERE
          player_match_score.player_id = ${playerId};`;

  const getMatchesOfPlayersResponse = await db.all(getMatchesOfPlayersQuery);
  response.send(getMatchesOfPlayersResponse);
});

//Return List Of Players Of Specific Match API

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;

  const getPlayersListOfSpecificMatch = `
    SELECT
      player_details.player_id AS playerId,
      player_details.player_name AS playerName
    FROM
      player_details
      INNER JOIN player_match_score
      ON player_details.player_id = player_match_score.player_id
    WHERE
      player_match_score.match_id = ${matchId};`;

  const playerArray = await db.all(getPlayersListOfSpecificMatch);
  response.send(playerArray);
});

//Return Statistics Of Players API

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;

  const getStatisticsOfPlayer = `
    SELECT
      player_details.player_id AS playerId,
      player_details.player_name AS playerName,
      SUM(player_match_score.score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM
      player_details
      INNER JOIN player_match_score
      ON player_details.player_id = player_match_score.player_id
    WHERE
      player_details.player_id = ${playerId};`;

  const getStatisticsResponse = await db.get(getStatisticsOfPlayer);
  response.send(getStatisticsResponse);
});

module.exports = app;
