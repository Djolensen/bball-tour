const fs = require("fs");

class Team {
  constructor(name, isoCode, fibaRanking) {
    this.name = name;
    this.isoCode = isoCode;
    this.fibaRanking = fibaRanking;
    this.pointsScored = 0;
    this.pointsConceded = 0;
    this.pointDifference = 0;
    this.points = 0;
    this.wins = 0;
    this.group = null;
  }

  getTeamInfo() {
    return `Team: ${this.name}, ISO Code: ${this.isoCode}, FIBA Ranking: ${this.fibaRanking}, Points: ${this.points}, Wins: ${this.wins}, Points Scored: ${this.pointsScored}, Points Conceded: ${this.pointsConceded}, Point Difference: ${this.pointDifference}`;
  }

  updateStats(pointsScored, pointsConceded, win, forfeit = false) {
    this.pointsScored += pointsScored;
    this.pointsConceded += pointsConceded;
    this.pointDifference = this.pointsScored - this.pointsConceded;

    if (forfeit) {
      this.points += 0;
    } else if (win) {
      this.wins += 1;
      this.points += 2;
    } else {
      this.points += 1;
    }
  }

  resetStats() {
    this.pointsScored = 0;
    this.pointsConceded = 0;
    this.pointDifference = 0;
    this.points = 0;
    this.wins = 0;
  }
}
function getExhibitionForm(teamISO) {
  const data = fs.readFileSync("exibitions.json", "utf-8");
  const exhibitions = JSON.parse(data);

  const matches = exhibitions[teamISO] || [];
  let form = 0;

  matches.forEach((match) => {
    const [teamPoints, opponentPoints] = match.Result.split("-").map(Number);
    form += teamPoints - opponentPoints;
  });

  return form;
}

class Group {
  constructor(groupName) {
    this.groupName = groupName;
    this.teams = [];
  }

  addTeam(team) {
    team.group = this.groupName;
    this.teams.push(team);
  }

  getGroupInfo() {
    return (
      `Group ${this.groupName} teams:\n` +
      this.teams.map((team) => team.getTeamInfo()).join("\n")
    );
  }

  simulateMatches() {
    const matchResults = {
      round1: [],
      round2: [],
      round3: [],
    };

    // Kolo 1
    matchResults.round1.push(this.simulateMatch(this.teams[0], this.teams[1]));
    matchResults.round1.push(this.simulateMatch(this.teams[2], this.teams[3]));

    // Kolo 2
    matchResults.round2.push(this.simulateMatch(this.teams[0], this.teams[2]));
    matchResults.round2.push(this.simulateMatch(this.teams[1], this.teams[3]));

    // Kolo 3
    matchResults.round3.push(this.simulateMatch(this.teams[0], this.teams[3]));
    matchResults.round3.push(this.simulateMatch(this.teams[1], this.teams[2]));

    return matchResults;
  }

  simulateMatch(team1, team2) {
    const probabilityTeam1Wins = this.calculateWinProbability(
      team1.fibaRanking,
      team2.fibaRanking
    );
    const randomValue = Math.random();
    let winner, loser, pointsWinner, pointsLoser;

    if (randomValue < probabilityTeam1Wins) {
      winner = team1;
      loser = team2;
    } else {
      winner = team2;
      loser = team1;
    }

    pointsWinner = Math.floor(Math.random() * 20) + 80;
    pointsLoser = Math.floor(Math.random() * 20) + 60;

    winner.updateStats(pointsWinner, pointsLoser, true);
    loser.updateStats(pointsLoser, pointsWinner, false);

    return {
      match: `${winner.name} ${pointsWinner} - ${pointsLoser} ${loser.name}`,
      winner: winner,
      loser: loser,
    };
  }

  calculateWinProbability(rank1, rank2) {
    const difference = rank2 - rank1;
    const probability = 1 / (1 + Math.exp(-difference / 10));
    return probability;
  }

  rankTeams() {
    this.teams.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      if (b.pointDifference !== a.pointDifference) {
        return b.pointDifference - a.pointDifference;
      }
      return b.pointsScored - a.pointsScored;
    });
  }

  getRankings() {
    this.rankTeams();
    return this.teams
      .map(
        (team, index) =>
          `${index + 1}. ${team.name} - Points: ${team.points}, Wins: ${
            team.wins
          }, Point Difference: ${team.pointDifference}`
      )
      .join("\n");
  }

  getTopTeams() {
    this.rankTeams();
    return this.teams.slice(0, 3); // Vraća prvoplasirani, drugoplasirani i trećeplasirani tim
  }
}

function rankTopTeams(teams) {
  return teams.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.pointDifference !== a.pointDifference) {
      return b.pointDifference - a.pointDifference;
    }
    return b.pointsScored - a.pointsScored;
  });
}

function createDraw(rankedTeams) {
  let validDraw = false;
  let quarterFinals = [];

  while (!validDraw) {
    quarterFinals = [];
    const potD = rankedTeams.slice(0, 2); // 1-2
    const potE = rankedTeams.slice(2, 4); //  3-4
    const potF = rankedTeams.slice(4, 6); //  5-6
    const potG = rankedTeams.slice(6, 8); //  7-8

    const usedTeams = new Set();

    console.log("\nPokušaj formiranja žreba:");

    try {
      // Ukrštanje šešira D i G
      potD.forEach((teamD) => {
        let opponentG;
        const potentialOpponents = potG.filter(
          (teamG) => teamD.group !== teamG.group && !usedTeams.has(teamG)
        );

        if (potentialOpponents.length === 0) throw new Error("Nevalidan žreb");

        opponentG =
          potentialOpponents[
            Math.floor(Math.random() * potentialOpponents.length)
          ];
        quarterFinals.push([teamD, opponentG]);
        usedTeams.add(opponentG);
      });

      // Ukrštanje šešira E i F
      potE.forEach((teamE) => {
        let opponentF;
        const potentialOpponents = potF.filter(
          (teamF) => teamE.group !== teamF.group && !usedTeams.has(teamF)
        );

        if (potentialOpponents.length === 0) throw new Error("Nevalidan žreb");

        opponentF =
          potentialOpponents[
            Math.floor(Math.random() * potentialOpponents.length)
          ];
        quarterFinals.push([teamE, opponentF]);
        usedTeams.add(opponentF);
      });

      validDraw = true;
    } catch (error) {
      console.log(error.message);
    }
  }

  console.log("\nValidan žreb formiran:");
  quarterFinals.forEach((pair) => {
    console.log(`${pair[0].name} vs ${pair[1].name}`);
  });

  return quarterFinals;
}

function simulateEliminationRound(matches) {
  const results = [];
  const winners = [];
  const losers = []; // Dodato za evidentiranje gubitnika

  matches.forEach((pair) => {
    if (!pair[0] || !pair[1]) {
      console.error(
        "Problem sa parom timova u eliminacionoj fazi:",
        pair[0],
        pair[1]
      );
      return;
    }

    const result = simulateMatch(pair[0], pair[1]);
    results.push(result.match);
    winners.push(result.winner);
    losers.push(result.loser); // Evidentiranje gubitnika
  });

  return { results, winners, losers };
}

function simulateMatch(team1, team2) {
  if (!team1 || !team2) {
    console.error(
      "Tim nije ispravno prosleđen u simulaciju meča:",
      team1,
      team2
    );
    return { match: "Invalid match", winner: null, loser: null };
  }

  const probabilityTeam1Wins = calculateWinProbability(
    team1.fibaRanking,
    team2.fibaRanking,
    team1.isoCode,
    team2.isoCode
  );
  const randomValue = Math.random();
  let winner, loser, pointsWinner, pointsLoser;

  if (randomValue < probabilityTeam1Wins) {
    winner = team1;
    loser = team2;
  } else {
    winner = team2;
    loser = team1;
  }

  pointsWinner = Math.floor(Math.random() * 20) + 80;
  pointsLoser = Math.floor(Math.random() * 20) + 60;

  winner.updateStats(pointsWinner, pointsLoser, true);
  loser.updateStats(pointsLoser, pointsWinner, false);

  return {
    match: `${winner.name} ${pointsWinner} - ${pointsLoser} ${loser.name}`,
    winner: winner,
    loser: loser,
  };
}

function calculateWinProbability(rank1, rank2, team1ISO, team2ISO) {
  const difference = rank2 - rank1;
  const baseProbability = 1 / (1 + Math.exp(-difference / 10));

  // Učitavamo formu oba tima
  const team1Form = getExhibitionForm(team1ISO);
  const team2Form = getExhibitionForm(team2ISO);

  // Ako je forma pozitivna, povećavamo šansu za pobedu, ako je negativna, smanjujemo
  const adjustedProbability = baseProbability + (team1Form - team2Form) * 0.01;

  // Ograničavamo verovatnoću da ostane između 0 i 1
  return Math.max(0, Math.min(1, adjustedProbability));
}

function simulateTournament(rankedTeams) {
  const quarterFinals = createDraw(rankedTeams);

  console.log("\nKostur eliminacione faze:");

  // Četvrtfinala
  const { results: qfResults, winners: qfWinners } =
    simulateEliminationRound(quarterFinals);
  console.log("\nČetvrtfinale:");
  console.log(qfResults.join("\n"));

  // Polufinala
  if (qfWinners.length < 4) {
    console.error("Nedovoljno pobednika u četvrtfinalima za polufinala.");
    return;
  }

  const semiFinals = [
    [qfWinners[0], qfWinners[1]],
    [qfWinners[2], qfWinners[3]],
  ];

  const {
    results: sfResults,
    winners: sfWinners,
    losers: sfLosers,
  } = simulateEliminationRound(semiFinals);
  console.log("\nPolufinale:");
  console.log(sfResults.join("\n"));

  // Utakmica za 3. mesto
  const thirdPlaceMatch = [sfLosers[0], sfLosers[1]];
  const thirdPlaceResult = simulateEliminationRound([thirdPlaceMatch]);
  console.log("\nUtakmica za 3. mesto:");
  console.log(thirdPlaceResult.results[0]);

  // Finale
  const finalMatch = [sfWinners[0], sfWinners[1]];
  const finalResult = simulateEliminationRound([finalMatch]);
  console.log("\nFinale:");
  console.log(finalResult.results[0]);

  const goldWinner = finalResult.winners[0];
  const silverWinner = finalMatch.find((team) => team !== goldWinner);

  console.log("\nTimovi koji su osvojili medalje:");
  console.log(`Zlato: ${goldWinner?.name}`);
  console.log(`Srebro: ${silverWinner?.name}`);
  console.log(`Bronza: ${thirdPlaceResult.winners[0]?.name}`);
}

function printRankings(
  rankedFirstPlaceTeams,
  rankedSecondPlaceTeams,
  rankedThirdPlaceTeams
) {
  console.log(`\nRangiranje prvoplasiranih timova (1-3):`);
  rankedFirstPlaceTeams.forEach((team, index) => {
    console.log(
      `${index + 1}. ${team.name} - Points: ${team.points}, Point Difference: ${
        team.pointDifference
      }, Points Scored: ${team.pointsScored}`
    );
  });

  console.log(`\nRangiranje drugoplasiranih timova (4-6):`);
  rankedSecondPlaceTeams.forEach((team, index) => {
    console.log(
      `${index + 4}. ${team.name} - Points: ${team.points}, Point Difference: ${
        team.pointDifference
      }, Points Scored: ${team.pointsScored}`
    );
  });

  console.log(`\nRangiranje trećeplasiranih timova (7-9):`);
  rankedThirdPlaceTeams.forEach((team, index) => {
    console.log(
      `${index + 7}. ${team.name} - Points: ${team.points}, Point Difference: ${
        team.pointDifference
      }, Points Scored: ${team.pointsScored}`
    );
  });
}

let groups = [];

function loadGroupsData() {
  fs.readFile("groups.json", "utf-8", (err, data) => {
    if (err) {
      console.error("Error loading groups data:", err);
      return;
    }

    const jsonData = JSON.parse(data);

    groups = Object.keys(jsonData).map((groupName) => {
      const group = new Group(groupName);

      jsonData[groupName].forEach((teamData) => {
        const team = new Team(
          teamData.Team,
          teamData.ISOCode,
          teamData.FIBARanking
        );
        group.addTeam(team);
      });

      return group;
    });

    groups.forEach((group) => {
      const matchResults = group.simulateMatches();
      console.log(`\nRezultati za grupu ${group.groupName}:`);

      console.log(`\nKolo 1:`);
      console.log(matchResults.round1.map((result) => result.match).join("\n"));

      console.log(`\nKolo 2:`);
      console.log(matchResults.round2.map((result) => result.match).join("\n"));

      console.log(`\nKolo 3:`);
      console.log(matchResults.round3.map((result) => result.match).join("\n"));

      console.log(`\nKonačno rangiranje grupe ${group.groupName}:`);
      console.log(group.getRankings());
    });

    const firstPlaceTeams = groups.map((group) => group.getTopTeams()[0]);
    const secondPlaceTeams = groups.map((group) => group.getTopTeams()[1]);
    const thirdPlaceTeams = groups.map((group) => group.getTopTeams()[2]);

    // Rangiranje prvoplasiranih
    const rankedFirstPlaceTeams = rankTopTeams(firstPlaceTeams);
    // Rangiranje drugoplasiranih
    const rankedSecondPlaceTeams = rankTopTeams(secondPlaceTeams);
    // Rangiranje trećeplasiranih
    const rankedThirdPlaceTeams = rankTopTeams(thirdPlaceTeams);

    // Ispis rangiranja od 1 do 9
    printRankings(
      rankedFirstPlaceTeams,
      rankedSecondPlaceTeams,
      rankedThirdPlaceTeams
    );

    // Formiranje žreba i kostura eliminacione faze
    simulateTournament([
      ...rankedFirstPlaceTeams,
      ...rankedSecondPlaceTeams,
      ...rankedThirdPlaceTeams,
    ]);
  });
}

loadGroupsData();
