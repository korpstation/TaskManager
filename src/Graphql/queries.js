import { gql } from "@apollo/client";

// 1. Liste toutes les listes de tâches
export const GET_TODO_LISTS = gql`
  query GetTodoLists($where: TodoListWhere) {
    todoLists(where: $where) {
      id
      title
      owner {
        id
        username
        roles
      }
    }
  }
`;

// 2. Récupère une liste précise (détail)
export const GET_TODO_LIST_DETAIL = gql`
  query GetTodoListDetail($id: ID!) {
    todoLists(where: { id: $id }) {
      id
      title
      owner {
        id
        username
      }
    }
  }
`;

// 3. Liste les tâches d’une liste
export const GET_TODOS_BY_LIST = gql`
  query GetTodosByList($listId: ID!) {
    todos(where: { belongsTo: { id: $listId } }) {
      id
      content
      done
    }
  }
`;

// 4. Récupère toutes les tâches de toutes les listes (si besoin)
export const GET_ALL_TODOS = gql`
  query GetAllTodos($where: TodoWhere) {
    todos(where: $where) {
      id
      content
      done
      belongsTo {
        id
        title
      }
    }
  }
`;

// 5. Rechercher un utilisateur par username (par exemple pour affichage profil)
export const GET_USER_BY_USERNAME = gql`
  query GetUserByUsername($username: String!) {
    users(where: { username: $username }) {
      id
      username
      roles
    }
  }
`;

// 6. Récupérer tous les utilisateurs (pour l’admin éventuellement)
export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      username
      roles
    }
  }
`;

// 7. Obtenir les infos d’un utilisateur précis (par id)
export const GET_USER_BY_ID = gql`
  query GetUserById($id: ID!) {
    users(where: { id: $id }) {
      id
      username
      roles
    }
  }
`;

// 8. Compter les tâches faites/pas faites d’une liste
export const GET_TODO_STATS_BY_LIST = gql`
  query GetTodoStatsByList($listId: ID!) {
    todos(where: { belongsTo: { id: $listId } }) {
      id
      done
    }
  }
`;

// 9. (Optionnel) Recherche avancée par contenu
export const SEARCH_TODOS = gql`
  query SearchTodos($keyword: String!) {
    todos(where: { content_CONTAINS: $keyword }) {
      id
      content
      done
      belongsTo {
        id
        title
      }
    }
  }
`;

export const GET_USER_ID = gql`
  query GetUserId($where: UserWhere) {
  users(where: $where) {
    id
  }
}
`;