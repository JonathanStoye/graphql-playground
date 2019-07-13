const { ApolloServer, gql } = require("apollo-server");

const authorsData = [
  { firstname: "J.K.", lastname: "Rowling" },
  { firstname: "Michael", lastname: "Crichton" }
];

// This is a (sample) collection of books we'll be able to query
// the GraphQL server for.  A more complete example might fetch
// from an existing data source like a REST API or database.
const booksData = [
  {
    title: "Harry Potter and the Chamber of Secrets",
    author: 0,
    chapters: ["Chapter 1", "Chapter 2", "Chapter 3"]
  },
  {
    title: "Jurassic Park",
    author: 1,
    chapters: ["Intro", "The Story", "Outro"]
  }
];

// Type definitions define the "shape" of your data and specify
// which ways the data can be fetched from the GraphQL server.
const typeDefs = gql`
  type Author {
    id: ID
    firstname: String
    lastname: String
    name: String
    books: [Book]
  }

  input AuthorInput {
    firstname: String
    lastname: String
  }

  # This "Book" type can be used in other type declarations.
  type Book {
    title: String
    author: Author
    chapters: [String]!
  }

  # The "Query" type is the root of all GraphQL queries.
  # (A "Mutation" type will be covered later on.)
  type Query {
    book(title: String!): Book
    books(title: String): [Book]
    author(index: Int!): Author
    authors: [Author]
  }

  type Mutation {
    createAuthor(author: AuthorInput): Author
  }
`;

const getAuthors = () =>
  authorsData.map((author, index) => ({
    ...author,
    name: `${author.firstname} ${author.lastname}`,
    id: index
  }));

const getBooks = () =>
  booksData.map(book => ({
    ...book
  }));

const authors = (parent, args, context, info) => getAuthors();

const author = (parent, args, context, info) =>
  getAuthors()[args.index || parent.author];

const books = (parent, args, context, info) => {
  const aggregatedBooks = getBooks();
  if (args.title) {
    const regex = new RegExp(args.title);
    return aggregatedBooks.filter(book => regex.test(book.title));
  }
  if (parent && typeof parent.id === "number") {
    return aggregatedBooks.filter(book => parent.id === book.author);
  }
  return aggregatedBooks;
};

const book = (parent, args, context, info) =>
  getBooks().find(book => args.title === book.title);

// Resolvers define the technique for fetching the types in the
// schema.  We'll retrieve books from the "books" array above.
const resolvers = {
  Query: {
    books,
    book,
    authors,
    author
  },
  Author: {
    books
  },
  Book: {
    author
  },
  Mutation: {
    createAuthor: (parent, { name }, context, info) => {
      const newAuthor = { name };
      authors.push(newAuthor);
      return newAuthor;
    }
  }
};

// In the most basic sense, the ApolloServer can be started
// by passing type definitions (typeDefs) and the resolvers
// responsible for fetching the data for those types.
const server = new ApolloServer({ typeDefs, resolvers });

// This `listen` method launches a web-server.  Existing apps
// can utilize middleware options, which we'll discuss later.
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
