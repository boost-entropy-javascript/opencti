import type { Resolvers } from '../../generated/graphql';
import { addNarrative, findById, findAll } from './narrative-domain';
import { buildRefRelationKey } from '../../schema/general';
import { RELATION_CREATED_BY, RELATION_OBJECT_LABEL, RELATION_OBJECT_MARKING } from '../../schema/stixMetaRelationship';
import {
  stixDomainObjectAddRelation,
  stixDomainObjectCleanContext,
  stixDomainObjectDelete, stixDomainObjectDeleteRelation,
  stixDomainObjectEditContext,
  stixDomainObjectEditField
} from '../../domain/stixDomainObject';

const narrativeResolvers: Resolvers = {
  Query: {
    narrative: (_, { id }, { user }) => findById(user, id),
    narratives: (_, args, { user }) => findAll(user, args),
  },
  NarrativesFilter: {
    createdBy: buildRefRelationKey(RELATION_CREATED_BY),
    markedBy: buildRefRelationKey(RELATION_OBJECT_MARKING),
    labelledBy: buildRefRelationKey(RELATION_OBJECT_LABEL),
  },
  Mutation: {
    narrativeAdd: (_, { input }, { user }) => {
      return addNarrative(user, input);
    },
    narrativeDelete: (_, { id }, { user }) => {
      return stixDomainObjectDelete(user, id);
    },
    narrativeFieldPatch: (_, { id, input, commitMessage, references }, { user }) => {
      return stixDomainObjectEditField(user, id, input, { commitMessage, references });
    },
    narrativeContextPatch: (_, { id, input }, { user }) => {
      return stixDomainObjectEditContext(user, id, input);
    },
    narrativeContextClean: (_, { id }, { user }) => {
      return stixDomainObjectCleanContext(user, id);
    },
    narrativeRelationAdd: (_, { id, input }, { user }) => {
      return stixDomainObjectAddRelation(user, id, input);
    },
    narrativeRelationDelete: (_, { id, toId, relationship_type: relationshipType }, { user }) => {
      return stixDomainObjectDeleteRelation(user, id, toId, relationshipType);
    },
  },
};

export default narrativeResolvers;
