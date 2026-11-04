<?php

declare(strict_types=1);

namespace App\Modules\Content\Mail;

use App\Modules\Content\Support\GmailConnection;
use App\Shared\Exceptions\GoogleOAuthException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Message;

/**
 * Sends letters through the Gmail API. It goes over HTTPS, so it works where hosting closes the mail ports
 * (Render's free plan does). The letter leaves from the connected mailbox and stays in its "Sent" folder.
 */
final class GmailApiTransport extends AbstractTransport
{
    private const SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

    public function __construct(private GmailConnection $connection)
    {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        try {
            $token = $this->connection->accessToken();

            $response = Http::withToken($token)->timeout(20)->post(self::SEND_URL, [
                'raw' => rtrim(strtr(base64_encode($this->letter($message)), '+/', '-_'), '='),
            ]);
        } catch (GoogleOAuthException|ConnectionException $exception) {
            throw new TransportException('Gmail: '.$exception->getMessage(), 0, $exception);
        }

        if ($response->failed()) {
            $this->connection->forgetAccessToken();

            throw new TransportException("Gmail answered with status {$response->status()}.");
        }
    }

    /**
     * The letter as text, from the connected mailbox: Gmail would replace any other address anyway.
     */
    private function letter(SentMessage $message): string
    {
        $original = $message->getOriginalMessage();
        $address = $this->connection->email();

        if (! $original instanceof Message || $address === null) {
            return $message->toString();
        }

        $letter = clone $original;
        $letter->getHeaders()->remove('From');
        $letter->getHeaders()->addMailboxListHeader('From', [new Address($address, $this->connection->senderName())]);

        return $letter->toString();
    }

    public function __toString(): string
    {
        return 'gmail+api://default';
    }
}
