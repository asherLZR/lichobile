import * as h from 'mithril/hyperscript'
import socket from '../../../socket'
import redraw from '../../../utils/redraw'
import i18n from '../../../i18n'
import * as utils from '../../../utils'
import { ErrorResponse } from '../../../http'
import { dropShadowHeader as headerWidget, backButton, connectingDropShadowHeader } from '../../shared/common'
import * as helper from '../../helper'
import layout from '../../layout'

import * as xhr from '../tournamentXhr'
import { tournamentBody, renderPlayerInfoOverlay, renderFAQOverlay, renderFooter, timeInfo } from './tournamentView'
import passwordForm from './passwordForm'
import TournamentCtrl from './TournamentCtrl'

interface Attrs {
  id: string
}

interface State {
  ctrl?: TournamentCtrl
  notFound?: boolean
}

export default {
  oninit({ attrs }) {
    xhr.tournament(attrs.id)
    .then(data => {
      this.ctrl = new TournamentCtrl(data)
    })
    .catch((err: ErrorResponse) => {
      if (err.status === 404) {
        this.notFound = true
        redraw()
      } else {
        utils.handleXhrError(err)
      }
    })
  },

  oncreate: helper.viewSlideIn,

  onremove() {
    socket.destroy()
    if (this.ctrl) {
      this.ctrl.unload()
    }
  },

  view() {
    if (this.notFound) {
      return layout.free(
        headerWidget(null, backButton(i18n('tournamentNotFound'))),
        h('div.tournamentNotFound', { key: 'tournament-not-found' }, [
          h('p', i18n('tournamentDoesNotExist')),
          h('p', i18n('tournamentMayHaveBeenCanceled'))
        ])
      )
    }

    if (!this.ctrl) {
      return layout.free(connectingDropShadowHeader(), null)
    }

    const tournament = this.ctrl.tournament
    let header: Mithril.Children

    header = headerWidget(null,
      backButton(h('div.main_header_title.withSub', [
        h('h1', [
          h('span.fa.fa-trophy'),
          this.ctrl.tournament.fullName
        ]),
        h('h2.header-subTitle.tournament-subtTitle',
        !tournament.isFinished && !tournament.isStarted ?
          timeInfo('created', tournament.secondsToStart, 'Starting in') :
          timeInfo('started', tournament.secondsToFinish, '')
        )
      ]))
    )

    const body = tournamentBody(this.ctrl)
    const footer = renderFooter(this.ctrl)
    const faqOverlay = renderFAQOverlay(this.ctrl)
    const playerInfoOverlay = renderPlayerInfoOverlay(this.ctrl)
    const overlay = [
      faqOverlay,
      playerInfoOverlay,
      passwordForm.view()
    ]

    return layout.free(header, body, footer, overlay)
  }
} as Mithril.Component<Attrs, State>
