import {Injectable} from "@angular/core";
import {Actions, Effect} from "@ngrx/effects";
import {Action, Store} from "@ngrx/store";
import {Observable} from "rxjs/Observable";
import {RedeemData} from "altcoinio-wallet";
import {Go, ResetApp} from "../actions/router.action";
import * as sideB from "../actions/side-B.action";
import {AppState} from "../reducers/app.state";
import {
  getBContractBin,
  getBContractTx,
  getBHashedSecret,
  getBLink,
  getBReceiveCoin,
  getBSecret,
} from "../selectors/side-b.selector";
import {getWalletState} from "../selectors/wallets.selector";
import {MoscaService} from "../services/mosca.service";
import {WalletFactory} from "../models/wallets/wallet";
import {CoinFactory} from "../models/coins/coin.model";
import {OrderService} from "../services/order.service";
import {LinkService} from "../services/link.service";
import {toPayload} from "../common/util";

@Injectable()
export class SideBEffect {
  @Effect()
  $initInitiate: Observable<Action> = this.actions$
    .ofType(sideB.INIT_INITIATE)
    .map(toPayload)
    .mergeMap((payload) => {
        return Observable.from([
          new Go({
            path: ["/b/complete"],
          }),
          new sideB.InitiateAction(payload),
        ]);
      },
    );

  @Effect()
  $initiate: Observable<Action> = this.actions$
    .ofType(sideB.INITIATE)
    .map(toPayload)
    .withLatestFrom(this.store.select(getWalletState))
    .mergeMap(([payload, walletState]) => {
        const coin = CoinFactory.createCoinFromString(payload.to);
        coin.amount = payload.toAmount;
        const wallet = WalletFactory.createWalletFromString(payload.to);
        console.log("INITIATE COIN", coin);
        const address = this.linkService.generateAddressForCoin(coin, walletState);
        return this.orderService.placeOrder(payload.to, payload.from, payload.toAmount, payload.fromAmount, address)
          .flatMap(init => wallet.Initiate(payload.address, coin), (orderData, initData) => {
            console.log("Initiated:....");
            console.log(orderData, initData);
            return new sideB.InitiateSuccessAction(initData);
          }).catch(err => Observable.of(new sideB.InitiateFailAction(err)));
      },
    );

  @Effect()
  $initiateSuccess: Observable<Action> = this.actions$
    .ofType(sideB.INITIATE_SUCCESS)
    .map(toPayload)
    .mergeMap((payload) => {
      console.log("INITIATE_SUCCESS");
      return Observable.from([
        new sideB.InformInitiateAction(payload),
      ]);
    });

  @Effect()
  $informInitiate: Observable<Action> = this.actions$
    .ofType(sideB.INFORM_INITIATE)
    .map(toPayload)
    .withLatestFrom(
      this.store.select(getBLink),
      this.store.select(getBReceiveCoin),
      this.store.select(getWalletState),
      (payload, blink, bReceiveCoin, walletState) => {
        return {
          payload,
          link: blink,
          receiveCoin: bReceiveCoin,
          wallet: walletState,
        };
      })
    .mergeMap((data) => {
        // TODO payload contains SECRET ------- TODO please correct this
        console.log("TODO payload contains SECRET ------- TODO please correct this");
        console.log("wallet type", data.receiveCoin.derive === undefined ? data.receiveCoin.name : data.receiveCoin.derive);
        const address = data.wallet[data.receiveCoin.derive === undefined ? data.receiveCoin.name : data.receiveCoin.derive].address;
        data.payload = {
          ...data.payload,
          address,
          secret: data.payload.secret,
        };
        return this.moscaService.informInitiate(data.link, data.payload).map(() => {
          return new sideB.InformInitiateSuccessAction(data.payload);
        }).catch(err => Observable.of(new sideB.InformInitiateFailAction(err)));
      },
    );

  @Effect()
  $informInitiateSuccess: Observable<Action> = this.actions$
    .ofType(sideB.INFORM_INITIATE_SUCCESS)
    .map(toPayload)
    .mergeMap((payload) => {
      return Observable.of(new sideB.WaitForParticipateAction(payload));
    });

  @Effect()
  $waitForParticipate: Observable<Action> = this.actions$
    .ofType(sideB.WAIT_FOR_PARTICIPATE)
    .map(toPayload)
    .withLatestFrom(this.store.select(getBLink),
      (payload, blink) => {
        return {
          payload,
          link: blink
        };
      })
    .mergeMap((data) => {
      return this.moscaService.waitForParticipate(data.link).map(resp => {
        return new sideB.WaitForParticipateSuccessAction(resp);
      }).catch(err => Observable.of(new sideB.WaitForParticipateFailAction(err)));
    });

  @Effect()
  $waitForParticipateSuccess: Observable<Action> = this.actions$
    .ofType(sideB.WAIT_FOR_PARTICIPATE_SUCCESS)
    .map(toPayload)
    .mergeMap((payload) => {
      return Observable.of(new sideB.BRedeemAction(payload));
    });

  @Effect()
  $redeem: Observable<Action> = this.actions$
    .ofType(sideB.BREDEEM)
    .map(toPayload)
    .withLatestFrom(
      this.store.select(getBSecret),
      this.store.select(getBHashedSecret),
      this.store.select(getWalletState),
      this.store.select(getBReceiveCoin),
      this.store.select(getBContractBin),
      this.store.select(getBContractTx),
      (payload, secret, hashedSecret, walletState, receiveCoin, contractBin, contractTx) => {
        return {
          payload,
          secret,
          hashedSecret,
          walletState,
          receiveCoin,
          contractBin,
          contractTx
        };
      }).mergeMap((data) => {

      console.log("REDEEM B SIDE:", data);
      const wallet = WalletFactory.createWallet(data.receiveCoin.type);
      return wallet.Redeem(new RedeemData(data.secret, data.hashedSecret, data.contractBin, data.contractTx), data.receiveCoin).map(resp => {
        console.log("REDEEM RESPONSE:", resp);
        return new sideB.BRedeemSuccessAction(resp);
      }).catch(err => Observable.of(new sideB.BRedeemFailAction(err)));
    });

  @Effect()
  $redeemSuccess: Observable<Action> = this.actions$
    .ofType(sideB.BREDEEM_SUCCESS)
    .map(toPayload)
    .withLatestFrom(
      this.store.select(getBLink),
      this.store.select(getBReceiveCoin),
      this.store.select(getWalletState),
      (payload, blink, bReceiveCoin, walletState) => {
        return {
          payload,
          link: blink,
          receiveCoin: bReceiveCoin,
          wallet: walletState
        };
      })
    .mergeMap((data) => {
        const address = data.wallet[data.receiveCoin.derive === undefined ? data.receiveCoin.name : data.receiveCoin.derive].address;
        data.payload = {
          ...data.payload,
          address,
          secret: data.payload.secret,
        };
        return this.moscaService.informBRedeem(data.link, data.payload).map(() => {
          return new sideB.InformRedeemedAction(data.payload);
        }).catch(err => Observable.of(new sideB.InformInitiateFailAction(err)));
      },
    );

  @Effect()
  $informRedeemed: Observable<Action> = this.actions$
    .ofType(sideB.INFORM_REDEEMED)
    .mergeMap(() => {
        return Observable.empty().map(resp => { // TODO provide implementation
          return new sideB.InformRedeemedSuccessAction(resp);
        }).catch(err => Observable.of(new sideB.InformRedeemedFailAction(err)));
      },
    );

  @Effect()
  $informRedeemedSuccess: Observable<Action> = this.actions$
    .ofType(sideB.INFORM_REDEEMED_SUCCESS)
    .mergeMap(() => {
      return Observable.from([
        new Go({path: ["/swap"]}),
        new sideB.BDoneAction(undefined)
      ]);
    });

  @Effect()
  $done: Observable<Action> = this.actions$
    .ofType(sideB.BDONE).delay(2000).mergeMap(() => {
      location.reload();
      return Observable.empty();
    });

  constructor(private actions$: Actions, private store: Store<AppState>, private linkService: LinkService,
              private moscaService: MoscaService, private orderService: OrderService) {
  }
}
