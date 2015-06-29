/*
OpenFisca -- A versatile microsimulation software
By: OpenFisca Team <contact@openfisca.fr>

Copyright (C) 2011, 2012, 2013, 2014, 2015 OpenFisca Team
https://github.com/openfisca

This file is part of OpenFisca.

OpenFisca is free software; you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

OpenFisca is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/


import {FormattedDate, FormattedMessage} from "react-intl";
import {Link} from "react-router";
import React, {PropTypes} from "react";
import {sortAlphabeticallyBy} from "trine/iterable/sortAlphabeticallyBy";
import {sortAlphabetically} from "trine/iterable/sortAlphabetically";
import {to} from "trine/iterable/to";

import AppPropTypes from "../../app-prop-types";
import FormulaSource from "../formula-source";
import GitHubLink from "../github-link";
import Highlight from "../highlight";
import List from "../list";


var VariablePage = React.createClass({
  propTypes: {
    computedVariables: PropTypes.arrayOf(AppPropTypes.variable).isRequired,
    countryPackageGitHeadSha: PropTypes.string.isRequired,
    variable: AppPropTypes.variable.isRequired,
  },
  render() {
    var {formula, label, name} = this.props.variable;
    return (
      <div>
        <p>
          {label}
          {label === name && " (à compléter)"}
        </p>
        {this.renderVariableDefinitionsList()}
        <hr />
        {
          formula && (
            formula["@type"] === "DatedFormula" ?
              this.renderDatedFormula(formula) :
              this.renderSimpleFormula(formula)
          )
        }
      </div>
    );
  },
  renderConsumerVariables() {
    const {computedVariables, variable} = this.props;
    const isConsumerVariable = variable2 => variable2.formula.parameters &&
      variable2.formula.input_variables.includes(variable.name);
    const consumerVariables = computedVariables.filter(isConsumerVariable);
    return [
      <dt key="dt">Variables appelantes</dt>,
      <dd key="dd">
        {
          consumerVariables && consumerVariables.length ? (
            <List items={consumerVariables::sortAlphabeticallyBy(() => this.name)::to(Array)} type="inline">
              {variable2 => <Link params={variable2} to="variable">{variable2.name}</Link>}
            </List>
          ) : (
            <span className="label label-default">Aucune</span>
          )
        }
      </dd>,
    ];
  },
  renderDatedFormula(formula) {
    return formula.dated_formulas.map((datedFormula, idx) => (
      <div key={idx}>
        <h4 style={{display: "inline-block"}}>
          {this.renderDatedFormulaHeading(datedFormula)}
        </h4>
        {this.renderFormula(datedFormula.formula)}
        <hr />
      </div>
    ));
  },
  renderDatedFormulaHeading(formula) {
    var heading;
    if (formula.start_instant && formula.stop_instant) {
      heading = (
        <FormattedMessage
          message="Formule de calcul du {start} au {stop}"
          start={<FormattedDate format="short" value={formula.start_instant} />}
          stop={<FormattedDate format="short" value={formula.stop_instant} />}
        />
      );
    } else if (formula.start_instant) {
      heading = (
        <FormattedMessage
          message="Formule de calcul depuis le {start}"
          start={<FormattedDate format="short" value={formula.start_instant} />}
        />
      );
    } else if (formula.stop_instant) {
      heading = (
        <FormattedMessage
          message="Formule de calcul jusqu'au {stop}"
          stop={<FormattedDate format="short" value={formula.stop_instant} />}
        />
      );
    }
    return heading;
  },
  renderFormula(formula) {
    var inputVariables = formula.input_variables;
    var {parameters} = formula;
    return (
      <div>
        {
          (inputVariables || parameters) && (
            <dl className="dl-horizontal">
              {inputVariables && <dt>Variables d'entrée</dt>}
              {
                inputVariables && (
                  <dd style={{marginBottom: "1em"}}>
                    <List items={inputVariables::sortAlphabetically()::to(Array)} type="inline">
                      {name => <Link params={{name}} to="variable">{name}</Link>}
                    </List>
                  </dd>
                )
              }
              {parameters && <dt>Paramètres</dt>}
              {
                parameters && (
                  <dd>
                    <List items={parameters::sortAlphabetically()::to(Array)} type="inline">
                      {name => <Link params={{name}} to="parameter">{name}</Link>}
                    </List>
                  </dd>
                )
              }
            </dl>
          )
        }
        <div style={{position: "relative"}}>
          <Highlight language="python">
            <FormulaSource inputVariables={inputVariables}>
              {formula.source}
            </FormulaSource>
          </Highlight>
          <GitHubLink
            blobUrlPath={`${formula.module.split(".").join("/")}.py`}
            commitReference={this.props.countryPackageGitHeadSha}
            endLineNumber={formula.line_number + formula.source.trim().split("\n").length - 1}
            lineNumber={formula.line_number}
            style={{
              position: "absolute",
              right: "0.5em",
              top: "0.3em",
            }}
          >
            {children => <small>{children}</small>}
          </GitHubLink>
        </div>
      </div>
    );
  },
  renderSimpleFormula(formula) {
    return (
      <div>
        <h4 style={{display: "inline-block"}}>Formule de calcul</h4>
        {this.renderFormula(formula)}
      </div>
    );
  },
  renderVariableDefinitionsList() {
    var {countryPackageGitHeadSha, variable} = this.props;
    var entityLabelByNamePlural = {
      familles: "Famille",
      "foyers_fiscaux": "Foyer fiscal",
      individus: "Individu",
      menages: "Ménage",
    };
    var type = variable["@type"];
    return (
      <dl className="dl-horizontal">
        <dt>Entité</dt>
        <dd>{entityLabelByNamePlural[variable.entity]}</dd>
        <dt>Type</dt>
        <dd>
          <code>{type}</code>
          {variable.val_type && ` (${variable.val_type})`}
        </dd>
        {type === "Enumeration" && <dt>Libellés</dt>}
        {
          type === "Enumeration" && (
            <dd>
              <List items={Object.entries(variable.labels)} type="unstyled">
                {entry => `${entry[0]} = ${entry[1]}`}
              </List>
            </dd>
          )
        }
        <dt>Valeur par défaut</dt>
        <dd><samp>{variable.default}</samp></dd>
        {
          variable.cerfa_field && [
            <dt key="cerfa-dt">Cases CERFA</dt>,
            <dd key="cerfa-dd">
              {
                typeof variable.cerfa_field === "string" ?
                  variable.cerfa_field :
                  Object.values(variable.cerfa_field).join(", ")
              }
            </dd>,
          ]
        }
        {
          variable.start && [
            <dt key="start-dt">Démarre le</dt>,
            <dd key="start-dd">
              <FormattedDate format="short" value={variable.start} />
            </dd>,
          ]
        }
        <dt>Code source</dt>
        <dd>
          {
            () => {
              var sourceCodeText = variable.module;
              if (variable.line_number) {
                sourceCodeText += ` ligne ${variable.line_number}`;
              }
              return sourceCodeText;
            }()
          }
          <GitHubLink
            blobUrlPath={`${variable.module.split(".").join("/")}.py`}
            commitReference={countryPackageGitHeadSha}
            lineNumber={variable.line_number}
            style={{marginLeft: "1em"}}
          >
            {children => <small>{children}</small>}
          </GitHubLink>
        </dd>
        {this.renderConsumerVariables()}
      </dl>
    );
  },
});


export default VariablePage;
