/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getGame = /* GraphQL */ `
  query GetGame($id: ID!) {
    getGame(id: $id) {
      id
      code
      status
      hostId
      players {
        nextToken
        __typename
      }
      currentRound
      maxRounds
      gameType
      currentLetters
      timeRemaining
      roundStartTime
      questions {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      settings
      __typename
    }
  }
`;
export const listGames = /* GraphQL */ `
  query ListGames(
    $filter: ModelGameFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGames(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        code
        status
        hostId
        currentRound
        maxRounds
        gameType
        currentLetters
        timeRemaining
        roundStartTime
        createdAt
        updatedAt
        settings
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getPlayer = /* GraphQL */ `
  query GetPlayer($id: ID!) {
    getPlayer(id: $id) {
      id
      gameId
      name
      score
      isHost
      isConfirmed
      answers {
        nextToken
        __typename
      }
      currentWords
      game {
        id
        code
        status
        hostId
        currentRound
        maxRounds
        gameType
        currentLetters
        timeRemaining
        roundStartTime
        createdAt
        updatedAt
        settings
        __typename
      }
      createdAt
      updatedAt
      gamePlayersId
      __typename
    }
  }
`;
export const listPlayers = /* GraphQL */ `
  query ListPlayers(
    $filter: ModelPlayerFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPlayers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        gameId
        name
        score
        isHost
        isConfirmed
        currentWords
        createdAt
        updatedAt
        gamePlayersId
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getQuestion = /* GraphQL */ `
  query GetQuestion($id: ID!) {
    getQuestion(id: $id) {
      id
      gameId
      content
      roundNumber
      answers {
        nextToken
        __typename
      }
      game {
        id
        code
        status
        hostId
        currentRound
        maxRounds
        gameType
        currentLetters
        timeRemaining
        roundStartTime
        createdAt
        updatedAt
        settings
        __typename
      }
      createdAt
      updatedAt
      gameQuestionsId
      __typename
    }
  }
`;
export const listQuestions = /* GraphQL */ `
  query ListQuestions(
    $filter: ModelQuestionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listQuestions(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        gameId
        content
        roundNumber
        createdAt
        updatedAt
        gameQuestionsId
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getAnswer = /* GraphQL */ `
  query GetAnswer($id: ID!) {
    getAnswer(id: $id) {
      id
      questionId
      playerId
      content
      votes
      player {
        id
        gameId
        name
        score
        isHost
        isConfirmed
        currentWords
        createdAt
        updatedAt
        gamePlayersId
        __typename
      }
      question {
        id
        gameId
        content
        roundNumber
        createdAt
        updatedAt
        gameQuestionsId
        __typename
      }
      createdAt
      updatedAt
      playerAnswersId
      questionAnswersId
      owner
      __typename
    }
  }
`;
export const listAnswers = /* GraphQL */ `
  query ListAnswers(
    $filter: ModelAnswerFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listAnswers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        questionId
        playerId
        content
        votes
        createdAt
        updatedAt
        playerAnswersId
        questionAnswersId
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const gameByCode = /* GraphQL */ `
  query GameByCode(
    $code: String!
    $sortDirection: ModelSortDirection
    $filter: ModelGameFilterInput
    $limit: Int
    $nextToken: String
  ) {
    gameByCode(
      code: $code
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        code
        status
        hostId
        currentRound
        maxRounds
        gameType
        currentLetters
        timeRemaining
        roundStartTime
        createdAt
        updatedAt
        settings
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const playersByGameId = /* GraphQL */ `
  query PlayersByGameId(
    $gameId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelPlayerFilterInput
    $limit: Int
    $nextToken: String
  ) {
    playersByGameId(
      gameId: $gameId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        gameId
        name
        score
        isHost
        isConfirmed
        currentWords
        createdAt
        updatedAt
        gamePlayersId
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const questionsByGameId = /* GraphQL */ `
  query QuestionsByGameId(
    $gameId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelQuestionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    questionsByGameId(
      gameId: $gameId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        gameId
        content
        roundNumber
        createdAt
        updatedAt
        gameQuestionsId
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const answersByQuestionId = /* GraphQL */ `
  query AnswersByQuestionId(
    $questionId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelAnswerFilterInput
    $limit: Int
    $nextToken: String
  ) {
    answersByQuestionId(
      questionId: $questionId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        questionId
        playerId
        content
        votes
        createdAt
        updatedAt
        playerAnswersId
        questionAnswersId
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const answersByPlayerId = /* GraphQL */ `
  query AnswersByPlayerId(
    $playerId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelAnswerFilterInput
    $limit: Int
    $nextToken: String
  ) {
    answersByPlayerId(
      playerId: $playerId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        questionId
        playerId
        content
        votes
        createdAt
        updatedAt
        playerAnswersId
        questionAnswersId
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
