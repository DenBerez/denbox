/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onUpdateGameById = /* GraphQL */ `
  subscription OnUpdateGameById($id: ID!) {
    onUpdateGameById(id: $id) {
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
      currentDrawing
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
export const onCreatePlayerByGameId = /* GraphQL */ `
  subscription OnCreatePlayerByGameId($gameId: ID!) {
    onCreatePlayerByGameId(gameId: $gameId) {
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
        currentDrawing
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
export const onUpdatePlayerByGameId = /* GraphQL */ `
  subscription OnUpdatePlayerByGameId($gameId: ID!) {
    onUpdatePlayerByGameId(gameId: $gameId) {
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
        currentDrawing
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
export const onCreateGame = /* GraphQL */ `
  subscription OnCreateGame($filter: ModelSubscriptionGameFilterInput) {
    onCreateGame(filter: $filter) {
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
      currentDrawing
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
export const onUpdateGame = /* GraphQL */ `
  subscription OnUpdateGame($filter: ModelSubscriptionGameFilterInput) {
    onUpdateGame(filter: $filter) {
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
      currentDrawing
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
export const onDeleteGame = /* GraphQL */ `
  subscription OnDeleteGame($filter: ModelSubscriptionGameFilterInput) {
    onDeleteGame(filter: $filter) {
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
      currentDrawing
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
export const onCreatePlayer = /* GraphQL */ `
  subscription OnCreatePlayer($filter: ModelSubscriptionPlayerFilterInput) {
    onCreatePlayer(filter: $filter) {
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
        currentDrawing
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
export const onUpdatePlayer = /* GraphQL */ `
  subscription OnUpdatePlayer($filter: ModelSubscriptionPlayerFilterInput) {
    onUpdatePlayer(filter: $filter) {
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
        currentDrawing
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
export const onDeletePlayer = /* GraphQL */ `
  subscription OnDeletePlayer($filter: ModelSubscriptionPlayerFilterInput) {
    onDeletePlayer(filter: $filter) {
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
        currentDrawing
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
export const onCreateQuestion = /* GraphQL */ `
  subscription OnCreateQuestion($filter: ModelSubscriptionQuestionFilterInput) {
    onCreateQuestion(filter: $filter) {
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
        currentDrawing
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
export const onUpdateQuestion = /* GraphQL */ `
  subscription OnUpdateQuestion($filter: ModelSubscriptionQuestionFilterInput) {
    onUpdateQuestion(filter: $filter) {
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
        currentDrawing
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
export const onDeleteQuestion = /* GraphQL */ `
  subscription OnDeleteQuestion($filter: ModelSubscriptionQuestionFilterInput) {
    onDeleteQuestion(filter: $filter) {
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
        currentDrawing
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
export const onCreateAnswer = /* GraphQL */ `
  subscription OnCreateAnswer($filter: ModelSubscriptionAnswerFilterInput) {
    onCreateAnswer(filter: $filter) {
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
export const onUpdateAnswer = /* GraphQL */ `
  subscription OnUpdateAnswer($filter: ModelSubscriptionAnswerFilterInput) {
    onUpdateAnswer(filter: $filter) {
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
export const onDeleteAnswer = /* GraphQL */ `
  subscription OnDeleteAnswer($filter: ModelSubscriptionAnswerFilterInput) {
    onDeleteAnswer(filter: $filter) {
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
