import { gql } from "@apollo/client";

const SaveNoteMutation = gql`
  mutation SaveNote($input: SaveNoteInput!) {
    saveNote(input: $input) {
      id
      name
      workspaceFolderId
    }
  }
`;

const SaveNoteBlockMutation = gql`
  mutation SaveNoteBlock($input: UpdateNoteEventInput!) {
    saveNoteBlock(input: $input)
  }
`;
