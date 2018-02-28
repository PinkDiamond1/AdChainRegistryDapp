import React, { Component } from 'react'
// import commafy from 'commafy'
import { Modal } from 'semantic-ui-react'
import './OpenProposalsTable.css'
import moment from 'moment-timezone'
import GovernanceChallengeContainer from './GovernanceChallengeContainer'
import ParamterizerService from '../services/parameterizer'

class OpenProposalsTable extends Component {
  constructor () {
    super()
    this.state = {
      open: false,
      table: '',
      selectedProposal: {
        appExpiry: '',
        name: '',
        minDeposit: '',
        proposedValue: ''
      }
    }
    this.close = this.close.bind(this)
  }

  show () {
    this.setState({ open: true })
  }

  close () {
    this.setState({ open: false })
  }

  async componentWillReceiveProps () {
    if (!this.props || !this.props.hasOwnProperty('currentProposals')) return false
    await this.createTable()
  }

  render () {
    const { open } = this.state
    return (
      <div className='BoxFrame mt-25'>
        <span className='BoxFrameLabel ui grid'>OPEN PROPOSALS</span>
        <table className='OpenProposalsTable mt-25'>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Proposed Value</th>
              <th>Proposal Ends</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            { this.state.table || [] }
          </tbody>
        </table>
        <Modal size={'small'} open={open} onClose={this.close}>
          <div>
            <GovernanceChallengeContainer proposal={this.state.selectedProposal} {...this.props} />
          </div>
        </Modal>
      </div>
    )
  }

  createTable () {
    let table = []
    return this.props.currentProposals.map((proposal, i) => {
      this.determineAction(proposal).then(async item => {
        table.push(
          <tr className='table-row' key={i}>
            <td className={proposal.color}>{proposal.name}</td>
            <td>{`${proposal.proposedValue + ' ' + proposal.metric}`}</td>
            <td>{moment.unix(moment.tz(proposal.appExpiry, moment.tz.guess())).format('YYYY-MM-DD HH:mm:ss')}</td>
            {item}
          </tr>
        )
        this.setState({table})
      })
    })
  }

  async determineAction (proposal) {
    let action = {
      event: '',
      class: '',
      label: ''
    }

    const propId = proposal.propId
    const challengeOpen = (proposal.challengeId === 0 && proposal.appExpiry && proposal.appExpiry > Date.now() / 1000)

    let commitOpen = await ParamterizerService.commitStageActive(propId)
    let revealOpen = await ParamterizerService.revealStageActive(propId)

    console.log(commitOpen, revealOpen, challengeOpen)
    if (commitOpen) {
      action.class = 'ui mini button blue'
      action.label = 'VOTE'
      proposal.stage = 'InCommit'
      action.event = () => { ParamterizerService.processProposal(propId) }
    } else if (revealOpen) {
      action.class = 'ui mini button green'
      action.label = 'REVEAL'
      proposal.stage = 'InReveal'
      action.event = () => { ParamterizerService.processProposal(propId) }
    } else if (challengeOpen) {
      action.class = 'ui mini button red challenge'
      action.label = 'CHALLENGE'
      action.event = () => { this.promptModal('challenge', proposal) }
      proposal.stage = 'InApplication'
    } else if (proposal) {
      action.class = 'ui mini button greyblack refresh'
      action.label = 'REFRESH STATUS'
      proposal.stage = 'InApplication'
      action.event = () => { ParamterizerService.processProposal(propId) }
    } else {
      console.log('not found')
    }

    return (
      <td>
        <a onClick={() => { action.event() }} name={propId} className={action.class}>
          {action.label}
        </a>
      </td>
    )
  }

  promptModal (type, proposal) {
    this.show()
    if (type === 'challenge') {
      this.setState({
        selectedProposal: proposal
      })
    }
  }

  isExpired (row) {
    const now = moment().unix()
    const end = row._original.stageEndsTimestamp

    if (!end) return false
    return end < now
  }
}

export default OpenProposalsTable
