import amqp from "amqplib";

// キュー名
const queueName = "queue";

const main = async () => {
  // RabbitMQとのTCP接続確立
  let connection: amqp.Connection;
  try {
    connection = await amqp.connect("amqp://guest:guest@localhost:5672");
  } catch (err) {
    console.error("[ERROR] Couldn't connect RabbitMQ.", err);
    return;
  }
  // TCP接続上に論理チャネルを作成
  let channel: amqp.ConfirmChannel;
  try {
    channel = await connection.createConfirmChannel();
  } catch (err) {
    console.error("[ERROR] Couldn't create channel.", err);
    return;
  }
  // キューの作成
  await channel.assertQueue(queueName, {
    durable: true, // RabbitMQサーバーが落ちてもキューを残す設定
  });
  // メッセージの送信
  const message = new Date().getTime().toString();
  channel.sendToQueue(
    queueName,
    Buffer.from(message),
    {
      persistent: true, // RabbitMQサーバーが落ちてもメッセージを残す設定
    },
    (err) => {
      // ACK/NACK応答時
      // ACK: メッセージ送信成功応答
      // NACK: メッセージ送信失敗応答（ネットワークエラーやRabbitMQ内部のエラー等）-> メッセージ再送
      console.log("[INFO] Send message: " + message, err ? "NACK" : "ACK", err);
    }
  );
  // すべてのメッセージ送信に対して応答があるまで待機
  await channel.waitForConfirms();
  // 論理チャネルの切断
  await channel.close();
  // RabbitMQとのTCP接続切断
  await connection.close();
};
main();
