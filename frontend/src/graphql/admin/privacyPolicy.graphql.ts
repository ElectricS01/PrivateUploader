import { gql } from "@apollo/client/core";

export const AdminMarkNewPPVersion = gql`
  mutation AdminMarkNewPPVersion {
    adminMarkNewPPVersion {
      success
    }
  }
`;
