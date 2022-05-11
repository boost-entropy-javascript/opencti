import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { interval } from 'rxjs';
import { graphql, createPaginationContainer } from 'react-relay';
import ListItem from '@mui/material/ListItem';
import { Link } from 'react-router-dom';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import { compose } from 'ramda';
import withStyles from '@mui/styles/withStyles';
import Tooltip from '@mui/material/Tooltip';
import * as R from 'ramda';
import { AutoFix } from 'mdi-material-ui';
import ItemIcon from '../../../../components/ItemIcon';
import { defaultValue } from '../../../../utils/Graph';
import inject18n from '../../../../components/i18n';
import { resolveLink } from '../../../../utils/Entity';
import { TEN_SECONDS } from '../../../../utils/Time';
import Security, { KNOWLEDGE_KNUPDATE } from '../../../../utils/Security';
import StixCoreRelationshipPopover from '../../common/stix_core_relationships/StixCoreRelationshipPopover';
import ItemConfidence from '../../../../components/ItemConfidence';

const interval$ = interval(TEN_SECONDS);

const styles = (theme) => ({
  item: {
    paddingLeft: 10,
    height: 50,
  },
  itemIcon: {
    color: theme.palette.primary.main,
  },
  itemHead: {
    paddingLeft: 10,
    textTransform: 'uppercase',
  },
  bodyItem: {
    height: 20,
    fontSize: 13,
    float: 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  goIcon: {
    position: 'absolute',
    right: -10,
  },
  itemIconDisabled: {
    color: theme.palette.grey[700],
  },
  placeholder: {
    display: 'inline-block',
    height: '1em',
    backgroundColor: theme.palette.grey[700],
  },
});

class StixCyberObservableEntitiesLinesComponent extends Component {
  componentDidMount() {
    this.subscription = interval$.subscribe(() => {
      this.props.relay.refetchConnection(25);
    });
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  render() {
    const {
      stixCyberObservableId,
      t,
      fsd,
      paginationOptions,
      data,
      classes,
      displayRelation,
    } = this.props;
    return (
      <div>
        {data
          && data.stixCoreRelationships
          && data.stixCoreRelationships.edges.map((stixCoreRelationshipEdge) => {
            const { node } = stixCoreRelationshipEdge;
            let restricted = false;
            let targetEntity = null;
            if (node.from && node.from.id === stixCyberObservableId) {
              targetEntity = node.to;
            } else if (node.to && node.to.id === stixCyberObservableId) {
              targetEntity = node.from;
            } else {
              restricted = true;
            }
            if (targetEntity === null) {
              restricted = true;
            }
            // eslint-disable-next-line no-nested-ternary
            const link = !restricted
              ? targetEntity.parent_types.includes('stix-core-relationship')
                ? `/dashboard/observations/observables/${stixCyberObservableId}/knowledge/relations/${node.id}`
                : `${resolveLink(targetEntity.entity_type)}/${
                  targetEntity.id
                }/knowledge/relations/${node.id}`
              : null;
            return (
              <ListItem
                classes={{ root: classes.item }}
                divider={true}
                button={true}
                component={Link}
                to={link}
                disabled={restricted}
              >
                <ListItemIcon classes={{ root: classes.itemIcon }}>
                  <ItemIcon
                    type={!restricted ? targetEntity.entity_type : 'restricted'}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <div>
                      {displayRelation && (
                        <div
                          className={classes.bodyItem}
                          style={{ width: '15%' }}
                        >
                          {t(`relationship_${node.relationship_type}`)}
                        </div>
                      )}
                      <div
                        className={classes.bodyItem}
                        style={{ width: '20%' }}
                      >
                        {!restricted
                          ? t(
                            `entity_${
                              targetEntity.entity_type === 'stix_relation'
                                || targetEntity.entity_type === 'stix-relation'
                                ? targetEntity.parent_types[0]
                                : targetEntity.entity_type
                            }`,
                          )
                          : t('Restricted')}
                      </div>
                      <div
                        className={classes.bodyItem}
                        style={{ width: '20%' }}
                      >
                        {/* eslint-disable-next-line no-nested-ternary */}
                        {!restricted
                          ? targetEntity.entity_type === 'stix_relation'
                            || targetEntity.entity_type === 'stix-relation'
                            ? `${targetEntity.from.name} ${String.fromCharCode(
                              8594,
                            )} ${defaultValue(targetEntity.to)}`
                            : defaultValue(targetEntity)
                          : t('Restricted')}
                      </div>
                      <div
                        className={classes.bodyItem}
                        style={{ width: '15%' }}
                      >
                        {fsd(node.start_time)}
                      </div>
                      <div
                        className={classes.bodyItem}
                        style={{ width: '15%' }}
                      >
                        {fsd(node.stop_time)}
                      </div>
                      <div
                        className={classes.bodyItem}
                        style={{ width: '15%' }}
                      >
                        <ItemConfidence
                          confidence={node.confidence}
                          variant="inList"
                        />
                      </div>
                    </div>
                  }
                />
                <ListItemSecondaryAction>
                  {node.is_inferred ? (
                    <Tooltip
                      title={
                        t('Inferred knowledge based on the rule ')
                        + R.head(node.x_opencti_inferences).rule.name
                      }
                    >
                      <AutoFix fontSize="small" style={{ marginLeft: -30 }} />
                    </Tooltip>
                  ) : (
                    <Security needs={[KNOWLEDGE_KNUPDATE]}>
                      <StixCoreRelationshipPopover
                        stixCoreRelationshipId={node.id}
                        paginationOptions={paginationOptions}
                        disabled={restricted}
                      />
                    </Security>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
      </div>
    );
  }
}

StixCyberObservableEntitiesLinesComponent.propTypes = {
  classes: PropTypes.object,
  paginationOptions: PropTypes.object,
  dataColumns: PropTypes.object.isRequired,
  entityId: PropTypes.string,
  data: PropTypes.object,
  relay: PropTypes.object,
  stixCoreRelationships: PropTypes.object,
  initialLoading: PropTypes.bool,
  entityLink: PropTypes.string,
  displayRelation: PropTypes.bool,
};

export const stixCyberObservableEntitiesLinesQuery = graphql`
  query StixCyberObservableEntitiesLinesPaginationQuery(
    $elementId: String
    $relationship_type: [String]
    $toTypes: [String]
    $startTimeStart: DateTime
    $startTimeStop: DateTime
    $stopTimeStart: DateTime
    $stopTimeStop: DateTime
    $confidences: [Int]
    $search: String
    $count: Int!
    $cursor: ID
    $orderBy: StixCoreRelationshipsOrdering
    $orderMode: OrderingMode
  ) {
    ...StixCyberObservableEntitiesLines_data
      @arguments(
        elementId: $elementId
        relationship_type: $relationship_type
        toTypes: $toTypes
        startTimeStart: $startTimeStart
        startTimeStop: $startTimeStop
        stopTimeStart: $stopTimeStart
        stopTimeStop: $stopTimeStop
        confidences: $confidences
        search: $search
        count: $count
        cursor: $cursor
        orderBy: $orderBy
        orderMode: $orderMode
      )
  }
`;

const StixCyberObservableEntitiesLines = createPaginationContainer(
  StixCyberObservableEntitiesLinesComponent,
  {
    data: graphql`
      fragment StixCyberObservableEntitiesLines_data on Query
      @argumentDefinitions(
        elementId: { type: "String" }
        relationship_type: { type: "[String]" }
        toTypes: { type: "[String]" }
        startTimeStart: { type: "DateTime" }
        startTimeStop: { type: "DateTime" }
        stopTimeStart: { type: "DateTime" }
        stopTimeStop: { type: "DateTime" }
        confidences: { type: "[Int]" }
        search: { type: "String" }
        count: { type: "Int", defaultValue: 25 }
        cursor: { type: "ID" }
        orderBy: {
          type: "StixCoreRelationshipsOrdering"
          defaultValue: start_time
        }
        orderMode: { type: "OrderingMode" }
      ) {
        stixCoreRelationships(
          elementId: $elementId
          relationship_type: $relationship_type
          toTypes: $toTypes
          startTimeStart: $startTimeStart
          startTimeStop: $startTimeStop
          stopTimeStart: $stopTimeStart
          stopTimeStop: $stopTimeStop
          confidences: $confidences
          search: $search
          first: $count
          after: $cursor
          orderBy: $orderBy
          orderMode: $orderMode
        ) @connection(key: "Pagination_stixCoreRelationships") {
          edges {
            node {
              id
              relationship_type
              confidence
              start_time
              stop_time
              description
              is_inferred
              x_opencti_inferences {
                rule {
                  id
                  name
                }
              }
              from {
                ... on BasicObject {
                  id
                  entity_type
                  parent_types
                }
                ... on StixObject {
                  created_at
                  updated_at
                }
                ... on AttackPattern {
                  name
                  description
                }
                ... on Campaign {
                  name
                  description
                }
                ... on CourseOfAction {
                  name
                  description
                }
                ... on Individual {
                  name
                  description
                }
                ... on Organization {
                  name
                  description
                }
                ... on Sector {
                  name
                  description
                }
                ... on System {
                  name
                  description
                }
                ... on Indicator {
                  name
                }
                ... on Infrastructure {
                  name
                }
                ... on IntrusionSet {
                  name
                  description
                }
                ... on Position {
                  name
                  description
                }
                ... on City {
                  name
                  description
                }
                ... on Country {
                  name
                  description
                }
                ... on Region {
                  name
                  description
                }
                ... on Malware {
                  name
                  description
                }
                ... on ThreatActor {
                  name
                  description
                }
                ... on Tool {
                  name
                  description
                }
                ... on Vulnerability {
                  name
                  description
                }
                ... on Incident {
                  name
                  description
                }
                ... on StixCyberObservable {
                  observable_value
                }
                ... on StixCoreRelationship {
                  from {
                    ... on BasicObject {
                      id
                      entity_type
                      parent_types
                    }
                    ... on StixObject {
                      created_at
                      updated_at
                    }
                    ... on AttackPattern {
                      name
                      description
                    }
                    ... on AttackPattern {
                      name
                      description
                    }
                    ... on Campaign {
                      name
                      description
                    }
                    ... on CourseOfAction {
                      name
                      description
                    }
                    ... on Individual {
                      name
                      description
                    }
                    ... on Organization {
                      name
                      description
                    }
                    ... on Sector {
                      name
                      description
                    }
                    ... on System {
                      name
                      description
                    }
                    ... on Indicator {
                      name
                    }
                    ... on Infrastructure {
                      name
                    }
                    ... on IntrusionSet {
                      name
                      description
                    }
                    ... on Position {
                      name
                      description
                    }
                    ... on City {
                      name
                      description
                    }
                    ... on Country {
                      name
                      description
                    }
                    ... on Region {
                      name
                      description
                    }
                    ... on Malware {
                      name
                      description
                    }
                    ... on ThreatActor {
                      name
                      description
                    }
                    ... on Tool {
                      name
                      description
                    }
                    ... on Vulnerability {
                      name
                      description
                    }
                    ... on Incident {
                      name
                      description
                    }
                    ... on StixCyberObservable {
                      observable_value
                    }
                  }
                  to {
                    ... on BasicObject {
                      id
                      entity_type
                      parent_types
                    }
                    ... on StixObject {
                      created_at
                      updated_at
                    }
                    ... on AttackPattern {
                      name
                      description
                    }
                    ... on AttackPattern {
                      name
                      description
                    }
                    ... on Campaign {
                      name
                      description
                    }
                    ... on CourseOfAction {
                      name
                      description
                    }
                    ... on Individual {
                      name
                      description
                    }
                    ... on Organization {
                      name
                      description
                    }
                    ... on Sector {
                      name
                      description
                    }
                    ... on System {
                      name
                      description
                    }
                    ... on Indicator {
                      name
                    }
                    ... on Infrastructure {
                      name
                    }
                    ... on IntrusionSet {
                      name
                      description
                    }
                    ... on Position {
                      name
                      description
                    }
                    ... on City {
                      name
                      description
                    }
                    ... on Country {
                      name
                      description
                    }
                    ... on Region {
                      name
                      description
                    }
                    ... on Malware {
                      name
                      description
                    }
                    ... on ThreatActor {
                      name
                      description
                    }
                    ... on Tool {
                      name
                      description
                    }
                    ... on Vulnerability {
                      name
                      description
                    }
                    ... on Incident {
                      name
                      description
                    }
                    ... on StixCyberObservable {
                      observable_value
                    }
                  }
                }
              }
              to {
                ... on BasicObject {
                  id
                  entity_type
                  parent_types
                }
                ... on StixObject {
                  created_at
                  updated_at
                }
                ... on AttackPattern {
                  name
                  description
                }
                ... on AttackPattern {
                  name
                  description
                }
                ... on Campaign {
                  name
                  description
                }
                ... on CourseOfAction {
                  name
                  description
                }
                ... on Individual {
                  name
                  description
                }
                ... on Organization {
                  name
                  description
                }
                ... on System {
                  name
                  description
                }
                ... on System {
                  name
                  description
                }
                ... on Indicator {
                  name
                }
                ... on Infrastructure {
                  name
                }
                ... on IntrusionSet {
                  name
                  description
                }
                ... on Position {
                  name
                  description
                }
                ... on City {
                  name
                  description
                }
                ... on Country {
                  name
                  description
                }
                ... on Region {
                  name
                  description
                }
                ... on Malware {
                  name
                  description
                }
                ... on ThreatActor {
                  name
                  description
                }
                ... on Tool {
                  name
                  description
                }
                ... on Vulnerability {
                  name
                  description
                }
                ... on Incident {
                  name
                  description
                }
                ... on StixCyberObservable {
                  observable_value
                }
                ... on StixCoreRelationship {
                  from {
                    ... on BasicObject {
                      id
                      entity_type
                      parent_types
                    }
                    ... on StixObject {
                      created_at
                      updated_at
                    }
                    ... on AttackPattern {
                      name
                      description
                    }
                    ... on AttackPattern {
                      name
                      description
                    }
                    ... on Campaign {
                      name
                      description
                    }
                    ... on CourseOfAction {
                      name
                      description
                    }
                    ... on Individual {
                      name
                      description
                    }
                    ... on Organization {
                      name
                      description
                    }
                    ... on Sector {
                      name
                      description
                    }
                    ... on System {
                      name
                      description
                    }
                    ... on Indicator {
                      name
                    }
                    ... on Infrastructure {
                      name
                    }
                    ... on IntrusionSet {
                      name
                      description
                    }
                    ... on Position {
                      name
                      description
                    }
                    ... on City {
                      name
                      description
                    }
                    ... on Country {
                      name
                      description
                    }
                    ... on Region {
                      name
                      description
                    }
                    ... on Malware {
                      name
                      description
                    }
                    ... on ThreatActor {
                      name
                      description
                    }
                    ... on Tool {
                      name
                      description
                    }
                    ... on Vulnerability {
                      name
                      description
                    }
                    ... on Incident {
                      name
                      description
                    }
                    ... on StixCyberObservable {
                      observable_value
                    }
                  }
                  to {
                    ... on BasicObject {
                      id
                      entity_type
                      parent_types
                    }
                    ... on StixObject {
                      created_at
                      updated_at
                    }
                    ... on AttackPattern {
                      name
                      description
                    }
                    ... on AttackPattern {
                      name
                      description
                    }
                    ... on Campaign {
                      name
                      description
                    }
                    ... on CourseOfAction {
                      name
                      description
                    }
                    ... on Individual {
                      name
                      description
                    }
                    ... on Organization {
                      name
                      description
                    }
                    ... on Sector {
                      name
                      description
                    }
                    ... on System {
                      name
                      description
                    }
                    ... on Indicator {
                      name
                    }
                    ... on Infrastructure {
                      name
                    }
                    ... on IntrusionSet {
                      name
                      description
                    }
                    ... on Position {
                      name
                      description
                    }
                    ... on City {
                      name
                      description
                    }
                    ... on Country {
                      name
                      description
                    }
                    ... on Region {
                      name
                      description
                    }
                    ... on Malware {
                      name
                      description
                    }
                    ... on ThreatActor {
                      name
                      description
                    }
                    ... on Tool {
                      name
                      description
                    }
                    ... on Vulnerability {
                      name
                      description
                    }
                    ... on Incident {
                      name
                      description
                    }
                    ... on StixCyberObservable {
                      observable_value
                    }
                  }
                }
              }
            }
          }
          pageInfo {
            endCursor
            hasNextPage
            globalCount
          }
        }
      }
    `,
  },
  {
    direction: 'forward',
    getConnectionFromProps(props) {
      return props.data && props.data.stixCoreRelationships;
    },
    getFragmentVariables(prevVars, totalCount) {
      return {
        ...prevVars,
        count: totalCount,
      };
    },
    getVariables(props, { count, cursor }, fragmentVariables) {
      return {
        elementId: fragmentVariables.elementId,
        toTypes: fragmentVariables.toTypes,
        relationship_type: fragmentVariables.relationship_type,
        startTimeStart: fragmentVariables.startTimeStart,
        startTimeStop: fragmentVariables.startTimeStop,
        stopTimeStart: fragmentVariables.stopTimeStart,
        stopTimeStop: fragmentVariables.stopTimeStop,
        confidences: fragmentVariables.confidences,
        search: fragmentVariables.search,
        count,
        cursor,
        orderBy: fragmentVariables.orderBy,
        orderMode: fragmentVariables.orderMode,
      };
    },
    query: stixCyberObservableEntitiesLinesQuery,
  },
);

export default compose(
  inject18n,
  withStyles(styles),
)(StixCyberObservableEntitiesLines);
