export const UserContributions = /* GraphQL */ `
  query UserContributions($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

export const UserActivity = /* GraphQL */ `
  query UserActivity($login: String!) {
    user(login: $login) {
      pullRequests(
        first: 20
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
        nodes {
          id
          title
          url
          state
          createdAt
          mergedAt
          repository {
            nameWithOwner
          }
        }
      }
      issues(
        first: 10
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
        nodes {
          id
          title
          url
          createdAt
          repository {
            nameWithOwner
          }
        }
      }
      repositories(
        first: 10
        ownerAffiliations: OWNER
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        nodes {
          nameWithOwner
          stargazerCount
          releases(first: 3, orderBy: { field: CREATED_AT, direction: DESC }) {
            nodes {
              id
              name
              tagName
              url
              publishedAt
              createdAt
            }
          }
        }
      }
    }
  }
`;
