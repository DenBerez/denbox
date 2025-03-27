/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createGame = /* GraphQL */ `
  mutation CreateGame(
    $input: CreateGameInput!
    $condition: ModelGameConditionInput
  ) {
    createGame(input: $input, condition: $condition) {
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
export const updateGame = /* GraphQL */ `
  mutation UpdateGame(
    $input: UpdateGameInput!
    $condition: ModelGameConditionInput
  ) {
    updateGame(input: $input, condition: $condition) {
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
export const deleteGame = /* GraphQL */ `
  mutation DeleteGame(
    $input: DeleteGameInput!
    $condition: ModelGameConditionInput
  ) {
    deleteGame(input: $input, condition: $condition) {
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
export const createPlayer = /* GraphQL */ `
  mutation CreatePlayer(
    $input: CreatePlayerInput!
    $condition: ModelPlayerConditionInput
  ) {
    createPlayer(input: $input, condition: $condition) {
      id
      gameId
      name
      avatarColor
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
export const updatePlayer = /* GraphQL */ `
  mutation UpdatePlayer(
    $input: UpdatePlayerInput!
    $condition: ModelPlayerConditionInput
  ) {
    updatePlayer(input: $input, condition: $condition) {
      id
      gameId
      name
      avatarColor
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
export const deletePlayer = /* GraphQL */ `
  mutation DeletePlayer(
    $input: DeletePlayerInput!
    $condition: ModelPlayerConditionInput
  ) {
    deletePlayer(input: $input, condition: $condition) {
      id
      gameId
      name
      avatarColor
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
export const createQuestion = /* GraphQL */ `
  mutation CreateQuestion(
    $input: CreateQuestionInput!
    $condition: ModelQuestionConditionInput
  ) {
    createQuestion(input: $input, condition: $condition) {
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
export const updateQuestion = /* GraphQL */ `
  mutation UpdateQuestion(
    $input: UpdateQuestionInput!
    $condition: ModelQuestionConditionInput
  ) {
    updateQuestion(input: $input, condition: $condition) {
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
export const deleteQuestion = /* GraphQL */ `
  mutation DeleteQuestion(
    $input: DeleteQuestionInput!
    $condition: ModelQuestionConditionInput
  ) {
    deleteQuestion(input: $input, condition: $condition) {
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
export const createAnswer = /* GraphQL */ `
  mutation CreateAnswer(
    $input: CreateAnswerInput!
    $condition: ModelAnswerConditionInput
  ) {
    createAnswer(input: $input, condition: $condition) {
      id
      questionId
      playerId
      content
      votes
      player {
        id
        gameId
        name
        avatarColor
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
export const updateAnswer = /* GraphQL */ `
  mutation UpdateAnswer(
    $input: UpdateAnswerInput!
    $condition: ModelAnswerConditionInput
  ) {
    updateAnswer(input: $input, condition: $condition) {
      id
      questionId
      playerId
      content
      votes
      player {
        id
        gameId
        name
        avatarColor
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
export const deleteAnswer = /* GraphQL */ `
  mutation DeleteAnswer(
    $input: DeleteAnswerInput!
    $condition: ModelAnswerConditionInput
  ) {
    deleteAnswer(input: $input, condition: $condition) {
      id
      questionId
      playerId
      content
      votes
      player {
        id
        gameId
        name
        avatarColor
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
