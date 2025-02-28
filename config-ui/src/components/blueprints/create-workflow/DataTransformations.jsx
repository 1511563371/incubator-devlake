/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import React, {
  Fragment,
  useEffect,
  useState,
  useCallback,
  useMemo
} from 'react'
import {
  Button,
  Icon,
  Intent,
  InputGroup,
  MenuItem,
  Divider,
  Elevation,
  Card,
  Colors,
  Spinner,
  Tooltip,
  Position
} from '@blueprintjs/core'
import { Select } from '@blueprintjs/select'
import { integrationsData } from '@/data/integrations'
import {
  Providers,
  ProviderTypes,
  ProviderIcons,
  ConnectionStatus,
  ConnectionStatusLabels
} from '@/data/Providers'
import { DataEntities, DataEntityTypes } from '@/data/DataEntities'
import { DEFAULT_DATA_ENTITIES } from '@/data/BlueprintWorkflow'

import ConnectionTabs from '@/components/blueprints/ConnectionTabs'
import NoData from '@/components/NoData'
import StandardStackedList from '@/components/blueprints/StandardStackedList'
import ProviderTransformationSettings from '@/components/blueprints/ProviderTransformationSettings'
import GithubSettings from '@/pages/configure/settings/github'

const DataTransformations = (props) => {
  const {
    provider,
    blueprint,
    activeStep,
    activeConnectionTab,
    blueprintConnections = [],
    dataEntities = {},
    projects = {},
    boards = {},
    issueTypes = [],
    fields = [],
    transformations = {},
    configuredConnection,
    configuredProject,
    configuredBoard,
    configurationKey,
    handleConnectionTabChange = () => {},
    prevStep = () => {},
    addBoardTransformation = () => {},
    addProjectTransformation = () => {},
    activeTransformation = {},
    setTransformations = () => {},
    setTransformationSettings = () => {},
    onSave = () => {},
    onCancel = () => {},
    onClear = () => {},
    fieldHasError = () => {},
    getFieldError = () => {},
    isSaving = false,
    isSavingConnection = false,
    isRunning = false,
    jiraProxyError,
    isFetchingJIRA = false,
    enableConnectionTabs = true,
    enableNoticeAlert = true,
    useDropdownSelector = false,
    enableGoBack = true,
    elevation = Elevation.TWO,
    cardStyle = {}
  } = props

  const isTransformationSupported = useMemo(
    () =>
      configuredProject ||
      configuredBoard ||
      (configuredConnection?.provider === Providers.JENKINS &&
        configuredConnection),
    [configuredProject, configuredBoard, configuredConnection]
  )

  const noTransformationsAvailable = useMemo(
    () =>
      [Providers.TAPD].includes(configuredConnection?.provider) ||
      ([Providers.GITLAB].includes(configuredConnection?.provider) &&
        dataEntities[configuredConnection?.id].every(
          (e) => e.value !== DataEntityTypes.DEVOPS
        )),
    [configuredConnection?.provider, configuredConnection?.id, dataEntities]
  )

  const boardsAndProjects = useMemo(
    () => [
      ...(Array.isArray(boards[configuredConnection?.id])
        ? boards[configuredConnection?.id]
        : []),
      ...(Array.isArray(projects[configuredConnection?.id])
        ? projects[configuredConnection?.id]
        : [])
    ],
    [projects, boards, configuredConnection?.id]
  )

  const [entityList, setEntityList] = useState(
    boardsAndProjects?.map((e, eIdx) => ({
      id: eIdx,
      value: e?.value,
      title: e?.title,
      entity: e,
      type: e.variant
    }))
  )
  const [activeEntity, setActiveEntity] = useState()

  const transformationHasProperties = useCallback(
    (item) => {
      const storedTransform = transformations[item?.id]
      return (
        storedTransform &&
        Object.values(storedTransform).some((v) => v && v.length > 0)
      )
    },
    [transformations]
  )

  useEffect(() => {
    console.log('>>> PROJECT/BOARD SELECT LIST DATA...', entityList)
    setActiveEntity(Array.isArray(entityList) ? entityList[0] : null)
  }, [entityList])

  useEffect(() => {
    if (useDropdownSelector) {
      console.log('>>>>> PROJECT / BOARD ENTITY SELECTED!', activeEntity)
      switch (activeEntity?.type) {
        case 'board':
          addBoardTransformation(activeEntity?.entity)
          break
        case 'project':
          addProjectTransformation(activeEntity?.entity)
          break
      }
    }
  }, [
    activeEntity,
    addBoardTransformation,
    addProjectTransformation,
    useDropdownSelector
  ])

  useEffect(() => {
    console.log(
      '>>> DATA TRANSFORMATIONS: DSM $configurationKey',
      configurationKey
    )
  }, [configurationKey])

  return (
    <div
      className='workflow-step workflow-step-add-transformation'
      data-step={activeStep?.id}
    >
      {enableNoticeAlert && (
        <p className='alert neutral'>
          Set transformation rules for your selected data to view more complex
          metrics in the dashboards.
          <br />
          <a
            href='#'
            className='more-link'
            rel='noreferrer'
            style={{
              // color: '#7497F7',
              marginTop: '5px',
              display: 'inline-block'
            }}
          >
            Find out more
          </a>
        </p>
      )}
      {blueprintConnections.length > 0 && (
        <div style={{ display: 'flex' }}>
          {enableConnectionTabs && (
            <div
              className='connection-tab-selector'
              style={{ minWidth: '200px' }}
            >
              <Card
                className='workflow-card connection-tabs-card'
                elevation={Elevation.TWO}
                style={{ padding: '10px' }}
              >
                <ConnectionTabs
                  connections={blueprintConnections}
                  onChange={handleConnectionTabChange}
                  selectedTabId={activeConnectionTab}
                />
              </Card>
            </div>
          )}
          <div
            className='connection-transformation'
            style={{ marginLeft: '10px', width: '100%' }}
          >
            <Card
              className='workflow-card workflow-panel-card'
              elevation={elevation}
              style={{ ...cardStyle }}
            >
              {configuredConnection && (
                <>
                  <h3>
                    <span style={{ float: 'left', marginRight: '8px' }}>
                      {ProviderIcons[configuredConnection.provider] ? (
                        ProviderIcons[configuredConnection.provider](24, 24)
                      ) : (
                        <></>
                      )}
                    </span>{' '}
                    {configuredConnection.title}
                  </h3>
                  <Divider className='section-divider' />

                  {useDropdownSelector &&
                    entityList &&
                    [
                      Providers.JIRA,
                      Providers.GITHUB,
                      Providers.GITLAB
                    ].includes(configuredConnection.provider) && (
                      <div
                        className='project-or-board-select'
                        style={{ marginBottom: '20px' }}
                      >
                        <h4>
                          {configuredConnection.provider === Providers.JIRA
                            ? 'Board'
                            : 'Project'}
                        </h4>
                        <Select
                          disabled={
                            configuredConnection.provider === Providers.JENKINS
                          }
                          popoverProps={{ usePortal: false }}
                          className='selector-entity'
                          id='selector-entity'
                          inline={false}
                          fill={true}
                          items={entityList}
                          activeItem={activeEntity}
                          itemPredicate={(query, item) =>
                            item?.title
                              ?.toString()
                              .toLowerCase()
                              .indexOf(query.toLowerCase()) >= 0
                          }
                          itemRenderer={(item, { handleClick, modifiers }) => (
                            <MenuItem
                              active={modifiers.active}
                              key={item.value}
                              // label={item.value}
                              onClick={handleClick}
                              text={item.title}
                            />
                          )}
                          noResults={
                            <MenuItem
                              disabled={true}
                              text='No projects or boards.'
                            />
                          }
                          onItemSelect={(item) => {
                            setActiveEntity(item)
                          }}
                        >
                          <Button
                            disabled={
                              configuredConnection.provider ===
                              Providers.JENKINS
                            }
                            className='btn-select-entity'
                            intent={Intent.PRIMARY}
                            outlined
                            text={
                              activeEntity
                                ? `${
                                    activeEntity?.title || '- None Available -'
                                  }`
                                : '< Select Project / Board >'
                            }
                            rightIcon='caret-down'
                            fill
                            style={{
                              maxWidth: '100%',
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}
                          />
                        </Select>
                      </div>
                    )}

                  {[Providers.GITLAB, Providers.GITHUB].includes(
                    configuredConnection.provider
                  ) &&
                    !useDropdownSelector &&
                    !configuredProject && (
                      <>
                        <StandardStackedList
                          items={projects}
                          transformations={transformations}
                          className='selected-items-list selected-projects-list'
                          connection={configuredConnection}
                          activeItem={configuredProject}
                          onAdd={addProjectTransformation}
                          onChange={addProjectTransformation}
                          isEditing={transformationHasProperties}
                        />
                        {projects[configuredConnection.id].length === 0 && (
                          <NoData
                            title='No Projects Selected'
                            icon='git-branch'
                            message='Please select specify at least one project.'
                            onClick={prevStep}
                          />
                        )}
                      </>
                    )}

                  {[Providers.JIRA].includes(configuredConnection.provider) &&
                    !useDropdownSelector &&
                    !configuredBoard && (
                      <>
                        <StandardStackedList
                          items={boards}
                          transformations={transformations}
                          className='selected-items-list selected-boards-list'
                          connection={configuredConnection}
                          activeItem={configuredBoard}
                          onAdd={addBoardTransformation}
                          onChange={addBoardTransformation}
                          isEditing={transformationHasProperties}
                        />
                        {boards[configuredConnection.id].length === 0 && (
                          <NoData
                            title='No Boards Selected'
                            icon='th'
                            message='Please select specify at least one board.'
                            onClick={prevStep}
                          />
                        )}
                      </>
                    )}

                  {isTransformationSupported && (
                    <div>
                      {!useDropdownSelector &&
                        (configuredProject || configuredBoard) && (
                          <>
                            <h4>Project</h4>
                            <p style={{ color: '#292B3F' }}>
                              {configuredProject?.title ||
                                configuredBoard?.title ||
                                '< select a project >'}
                            </p>
                          </>
                        )}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <h4 style={{ margin: 0 }}>Data Transformation Rules</h4>
                        <div />
                      </div>

                      {!dataEntities[configuredConnection.id] ||
                        (dataEntities[configuredConnection.id]?.length ===
                          0 && <p>(No Data Entities Selected)</p>)}

                      {dataEntities[configuredConnection.id]?.find((e) =>
                        DEFAULT_DATA_ENTITIES.some((dE) => dE.value === e.value)
                      ) && (
                        <ProviderTransformationSettings
                          provider={integrationsData.find(
                            (i) => i.id === configuredConnection?.provider
                          )}
                          blueprint={blueprint}
                          connection={configuredConnection}
                          configuredProject={configuredProject}
                          configuredBoard={configuredBoard}
                          entityIdKey={configurationKey}
                          issueTypes={issueTypes}
                          fields={fields}
                          boards={boards}
                          projects={projects}
                          entities={dataEntities}
                          transformation={activeTransformation}
                          transformations={transformations}
                          onSettingsChange={setTransformationSettings}
                          isSaving={isSaving}
                          isFetchingJIRA={isFetchingJIRA}
                          isSavingConnection={isSavingConnection}
                          jiraProxyError={jiraProxyError}
                        />
                      )}

                      <div
                        className='transformation-actions'
                        style={{ display: 'flex', justifyContent: 'flex-end' }}
                      >
                        {enableGoBack &&
                          (configuredProject || configuredBoard) && (
                            <Tooltip
                              position={Position.TOP}
                              intent={Intent.PRIMARY}
                              content='Close Editor to Continue'
                            >
                              <Button
                                text='Go Back'
                                intent={Intent.PRIMARY}
                                small
                                outlined
                                onClick={() => onSave()}
                                style={{ marginLeft: '5px' }}
                              />
                            </Tooltip>
                          )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {noTransformationsAvailable && (
                <>
                  <div className='bp3-non-ideal-state'>
                    <div className='bp3-non-ideal-state-visual'>
                      <Icon icon='disable' size={32} />
                    </div>
                    <div className='bp3-non-ideal-state-text'>
                      <h4 className='bp3-heading' style={{ margin: 0 }}>
                        No Data Transformations
                      </h4>
                      <div>
                        No additional settings are available at this time.
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      )}
      {blueprintConnections.length === 0 && (
        <>
          <div className='bp3-non-ideal-state'>
            <div className='bp3-non-ideal-state-visual'>
              <Icon icon='offline' size={32} />
            </div>
            <div className='bp3-non-ideal-state-text'>
              <h4 className='bp3-heading' style={{ margin: 0 }}>
                No Data Connections
              </h4>
              <div>Please select at least one connection source.</div>
            </div>
            <button
              className='bp3-button bp4-intent-primary'
              onClick={prevStep}
            >
              Go Back
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default DataTransformations
