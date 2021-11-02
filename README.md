# GASウェブアプリでプランニングポーカーを作ってみた

![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/282054/928512a4-b56d-3a7f-280b-6ee259c81d3d.png)


- [Poker room 公開用リンク](https://script.google.com/macros/s/AKfycbxIGjw3fDdSui9Y958CBu3O66RN8w26uxmLGJT3JSiPfqwa4lR6tLWCR0E8Buj1wr1z/exec)


## 背景

チームでプランニングポーカーを実施していた時に、`１３〜２１って範囲が少し広すぎるよ`とか`気づいたら接続切れてて部屋作り直しになった`など、大した問題ではないが、少し使い勝手の悪さを感じていたので自作してみました。

## 利用技術

- Google Apps Script
- Vue.js
- Bulma

### 仕組み

![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/282054/a13317b3-085a-92f9-37a7-af0d6ddfc042.png)

- Clientで稼働するのは、Vue.js＋Bulmaで構築される画面
- GoogleAppsScriptでは、Roomのデータ管理を実施

## 機能紹介

- 選択項目を誰でも好きなように変更可能

    <img width="30%" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/282054/b8dde55d-6397-9314-ace7-4deb6e1b9a1e.png"><img width="30%" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/282054/28e8c540-94f6-f503-510c-b8e6c053764e.png"><img width="30%" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/282054/bf903792-7776-da37-5384-b31c1a75ab0d.png"><img width="30%" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/282054/29c0f049-cf28-6432-9b13-faa5d785e321.png">


  - プリセットされている選択項目は４つ
  - 値は変更可能であり、制限も設けていないので自由な文字に変更可能
  - `+ -`ボタンで自由に追加削除可能

- 作成した部屋にアクセスするID付きURLをクリップボードコピー

    ![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/282054/269117d0-ee0a-8fca-f9c3-7b75499f1ed3.png)

- カード表示の各種機能

    ![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/282054/cc6eee2c-34b0-67ee-4786-e749d05de16a.png)

  - アイコンにより、選択中/済みが判別可能
  - 右上の`x`ボタンで退場する、させることが可能
  - 全員の選択が完了すると自動オープン

- 選択結果の平均、最大、最小表示

    ![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/282054/25ffad30-ae29-f118-4de3-af5d53d24937.png)

- Ghostモード参加機能

    ![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/282054/6ba54608-dee8-5ad6-550b-75f939441116.png)

    - ポーカーに参加しないが、見学する場合にカードを選択が制限されている状態で参加することが可能

## 実装

https://github.com/Yamamoto-Shohei/gas-poker-room

- 動作させる場合は、以下の手順で実施してください。
    1. GoogleAppsScriptを新規作成して、GitHubのプログラムを登録する。
    1. .html は、HTMLで登録、 .gs は、スクリプトで登録してください。
    1. デプロイ - 新しいデプロイでウェブアプリとしてデプロイする。
      <details><summary>設定画像</summary><div>
              <img width="30%" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/282054/0c25efa8-3697-e619-5fdb-ebc0ab5f02ba.png">
      </div></details>
    1. トリガー - トリガーを追加 - `deleteProperty`を1時間おきで登録する。
      <details><summary>設定画像</summary><div>
              <img width="30%" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/282054/143b0124-e6ad-3adc-f612-9f91db8a0cc9.png">
      </div></details>
    1. 発行されたURLにアクセスする。

### POINT説明

#### データはGASの`PropertiesService`を利用

```java:main.gs
const saveRoomData = (id, data) => PropertiesService.getScriptProperties().setProperty(id, JSON.stringify({
  ...data, 
  lastUpdated: (new Date()).toISOString()
}))

const getRoomData = (id) => {
  const property = PropertiesService.getScriptProperties().getProperty(id)
  return property ? JSON.parse(property) : false
}
```

よくある、GASといえばSpreadSheetでも良いのですが、`比較的短時間の利用であること`と、`データを保管し続けない（roomの利用が終了すると不要データになる）こと`から、PropertiesServiceを利用しています。
格納できるデータ上限もありますが、一時保存先なので十分であると判断しました。

また、定期的に不要になったデータを削除するトリガーを設定してクリーニングしています。

```javascript:main.gs
const deleteProperty = () => {
  const properties = PropertiesService.getScriptProperties().getProperties()
  const checkDate = new Date()
  checkDate.setHours(checkDate.getHours() - 2)
  Object.keys(properties)
    .filter(key => JSON.parse(properties[key]).lastUpdated < checkDate.toISOString())
    .forEach(key => PropertiesService.getScriptProperties().deleteProperty(key))
}
```

#### データ同期は、2秒おきのポーリング

```javascript:index.html
  polling: async function() {
    if (this.isPolling) return
    this.isPolling = true
    while (this.isPolling) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      google.script.run.withSuccessHandler((response) => {
        const updateRoomData = response.roomData ? JSON.parse(response.roomData) : null
        if (!updateRoomData || !updateRoomData.users[this.userId]) {
          window.open(this.url, '_top')
          return
        }
        this.roomData = updateRoomData
      }).withFailureHandler((e) => {
        console.log(e)
      }).polling(this.roomId)
    }
  },
```

同時接続部屋を作るのが得意なWebSocketを利用する方法も考えたのですが、サーバーが必要になるので
今回は、ポーリングで実現しました。

## 感想

ここをベースに、チームにあった選択項目や、カード表示にカスタマイズしていくことで、楽しいプランニングポーカーが実施できるのではないかと感じました。
ただ、たくさんのユーザに公開してアクセス数が増えるとキャパオーバーになるので、あくまでも内輪利用専用です。

機能拡張はしていく予定ですので、こんな機能があると面白いなどコメントいただけると対応してGitHubを更新していきます。
Issueに上げていただけると感激です。

