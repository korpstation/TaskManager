export const isDemoUser = (username) =>
  typeof username === 'string' && username.startsWith('demo-');

export const MOCK_USERS = [
  {
    id: 'demo-owner-1',
    username: 'demo-user',
    roles: ['user'],
    password: 'password1',
  },
];

export const MOCK_LISTS = [
  {
    id: 'demo-list-1',
    title: 'List 1',
    owner: {
      id: 'demo-owner-1',
      username: 'demo-user',
      roles: ['user'],
    },
    todos: [
      {
        id: 'demo-todo-1',
        content: 'Task 1',
        done: true,
      },
      {
        id: 'demo-todo-2',
        content: 'Task 2',
        done: true,
      },
    ],
  },
  {
    id: 'demo-list-2',
    title: 'List 2',
    owner: {
      id: 'demo-owner-1',
      username: 'demo-user',
      roles: ['user'],
    },
    todos: [
      {
        id: 'demo-todo-3',
        content: 'Task 3',
        done: false,
      },
    ],
  },
  {
    id: 'demo-list-3',
    title: 'List 3',
    owner: {
      id: 'demo-owner-1',
      username: 'demo-user',
      roles: ['user'],
    },
    todos: [
      {
        id: 'demo-todo-4',
        content: 'Task 4',
        done: true,
      },
      {
        id: 'demo-todo-5',
        content: 'Task 5',
        done: false,
      },
      {
        id: 'demo-todo-6',
        content: 'Task 6',
        done: false,
      },
      {
        id: 'demo-todo-7',
        content: 'Task 7',
        done: false,
      },
    ],
  },
];

// petit helper id
const randomId = (prefix) =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

// Création d'un nouveau user demo
export const createDemoUser = async (username, password) => {
  const existing = MOCK_USERS.find((u) => u.username === username);
  if (existing) {
    throw new Error('Demo username already exists');
  }

  const newUser = {
    id: randomId('demo-owner'),
    username,
    roles: ['user'],
    password,
  };
  MOCK_USERS.push(newUser);
  return newUser;
};

// Auth mock
export const signInMock = async (username, password) => {
  const user = MOCK_USERS.find((u) => u.username === username);
  if (!user || user.password !== password) {
    throw new Error('Invalid credentials (mock)');
  }
  return {
    token: 'mock-token-' + username,
    userId: user.id,
  };
};

export const getUserIdMock = async (username) => {
  const user = MOCK_USERS.find((u) => u.username === username);
  return user?.id || null;
};

// LISTES

// toutes les listes d’un user
export const getListsMock = async (ownerId) => {
  return MOCK_LISTS.filter((l) => l.owner.id === ownerId);
};

// détail d’une liste
export const getListDetailMock = async (listId) => {
  return MOCK_LISTS.find((l) => l.id === listId) || null;
};

// créer une liste
export const createListMock = async (title, owner) => {
  const newList = {
    id: randomId('demo-list'),
    title,
    owner: {
      id: owner.id,
      username: owner.username,
      roles: owner.roles || ['user'],
    },
    todos: [],
  };
  MOCK_LISTS.push(newList);
  return newList;
};

// renommer une liste
export const updateListMock = async (id, title) => {
  const list = MOCK_LISTS.find((l) => l.id === id);
  if (!list) return null;
  list.title = title;
  return list;
};

// supprimer une liste
export const deleteListMock = async (id) => {
  const index = MOCK_LISTS.findIndex((l) => l.id === id);
  if (index !== -1) {
    MOCK_LISTS.splice(index, 1);
  }
  return true;
};

// supprimer toutes les listes d’un user
export const deleteAllListsMock = async (ownerId) => {
  for (let i = MOCK_LISTS.length - 1; i >= 0; i--) {
    if (MOCK_LISTS[i].owner.id === ownerId) {
      MOCK_LISTS.splice(i, 1);
    }
  }
  return true;
};

// TODOS (items des listes)

// todos d’une liste
export const getTodosByListMock = async (listId) => {
  const list = MOCK_LISTS.find((l) => l.id === listId);
  return list ? list.todos : [];
};

// créer un todo
export const createTodoMock = async ({ content, done, listId }) => {
  const list = MOCK_LISTS.find((l) => l.id === listId);
  if (!list) throw new Error('List not found (mock)');
  const newTodo = {
    id: randomId('demo-todo'),
    content,
    done: !!done,
  };
  list.todos.push(newTodo);
  return newTodo;
};

// mettre à jour un todo
export const updateTodoMock = async ({ id, content, done }) => {
  for (const list of MOCK_LISTS) {
    const t = list.todos.find((todo) => todo.id === id);
    if (t) {
      if (typeof content !== 'undefined') t.content = content;
      if (typeof done !== 'undefined') t.done = done;
      return t;
    }
  }
  return null;
};

// supprimer un todo
export const deleteTodoMock = async (id) => {
  for (const list of MOCK_LISTS) {
    const index = list.todos.findIndex((t) => t.id === id);
    if (index !== -1) {
      list.todos.splice(index, 1);
      return true;
    }
  }
  return true;
};

// supprimer un user (et ses listes)
export const deleteUserMock = async (userId) => {
  await deleteAllListsMock(userId);
  const idx = MOCK_USERS.findIndex((u) => u.id === userId);
  if (idx !== -1) {
    MOCK_USERS.splice(idx, 1);
  }
  return true;
};
