import amqp from "amqplib";

// エクスチェンジ名
const exchangeName = "exchange";

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
  await channel.assertExchange(exchangeName, "fanout", {
    durable: true, // 再起動時にキューを残さない
  });
  // 無名のTemporaryQueueを定義
  const queue = await channel.assertQueue("", { exclusive: true });
  // Binding: ExchangeとTemporaryQueueを関連付ける
  await channel.bindQueue(queue.queue, exchangeName, "");
  // メッセージの受信
  console.log(
    `[INFO] Waiting for message in ${queue.queue}. To exit press CTRL+C`
  );
  await channel.consume(queue.queue, async (msg) => {
    if (msg) {
      console.log("[INFO] Receive message: " + msg.content.toString());
      // メッセージの受信に成功した為、ACK応答を返す -> キューのメッセージが削除される
      channel.ack(msg);
    } else {
      console.error("[ERROR] Receive null message");
    }
  });
};
main();
