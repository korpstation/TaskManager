import { gql } from '@apollo/client';

// ---------- AUTHENTIFICATION ----------

// Inscription (retourne un token)
export const SIGN_UP = gql`
  mutation SignUp($username: String!, $password: String!) {
    signUp(username: $username, password: $password)
  }
`;

// Connexion (retourne un token)
export const SIGN_IN = gql`
  mutation SignIn($username: String!, $password: String!) {
    signIn(username: $username, password: $password)
  }
`;

// ---------- LISTES DE TÂCHES (TodoList) ----------

// Créer une nouvelle liste
export const CREATE_TODO_LIST = gql`
  mutation CreateTodoLists($input: [TodoListCreateInput!]!) {
  createTodoLists(input: $input) {
    todoLists {
      id
      title
    }
  }
}
`;

// Mettre à jour une liste (titre)
export const UPDATE_TODO_LIST = gql`
  mutation UpdateTodoList($id: ID!, $title: String!) {
    updateTodoLists(
      where: { id: $id }
      update: { title: $title }
    ) {
      todoLists {
        id
        title
      }
    }
  }
`;

// Supprimer une liste
export const DELETE_TODO_LIST = gql`
  mutation DeleteTodoList($id: ID!) {
    deleteTodoLists(where: { id: $id }) {
      nodesDeleted
      relationshipsDeleted
    }
  }
`;

// ---------- TÂCHES (Todos) ----------

// Créer une tâche associée à une liste
export const CREATE_TODO = gql`
  mutation CreateTodo($content: String!, $listId: ID!) {
    createTodos(
      input: [{
        content: $content,
        belongsTo: { connect: { where: { id: $listId } } }
      }]
    ) {
      todos {
        id
        content
        done
        belongsTo { id }
      }
    }
  }
`;

// Mettre à jour une tâche (texte, ou terminé)
export const UPDATE_TODO = gql`
  mutation UpdateTodo($id: ID!, $content: String, $done: Boolean) {
    updateTodos(
      where: { id: $id }
      update: { content: $content, done: $done }
    ) {
      todos {
        id
        content
        done
      }
    }
  }
`;

// Supprimer une tâche
export const DELETE_TODO = gql`
  mutation DeleteTodo($id: ID!) {
    deleteTodos(where: { id: $id }) {
      nodesDeleted
      relationshipsDeleted
    }
  }
`;

// ---------- UTILISATEUR (Admin) ----------

// Supprimer un compte utilisateur
export const DELETE_USER = gql`
  mutation DeleteUsers($where: UserWhere) {
  deleteUsers(where: $where) {
    nodesDeleted
    relationshipsDeleted
  }
}
`;

// Mettre à jour l'utilisateur (par exemple changer username, rôles, etc)
export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $username: String) {
    updateUsers(
      where: { id: $id }
      update: { username: $username }
    ) {
      users {
        id
        username
      }
    }
  }
`;
