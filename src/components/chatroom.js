import React, { useEffect, useRef, useState } from 'react';
import './chatroom.css';
import Message from './message.js';
//import translateText from './translate'
import translateTextAPI from './translateAPI'
import { addChat, useGlobalState } from '../store/state';

const Chatroom = (props) => {

    const [Chats] = useGlobalState('Chats');
    const currentContactId = useGlobalState('currentContactId');
    const [newMessage, setNewMessage] = useState("");
    const [languageTranslate] = useGlobalState('languageTranslate');
    const [languageOptions] = useGlobalState('languageOptions');
    const agentUsername = 'AGENT';
    const messageEl = useRef(null);
    const input = useRef(null);
    
    function getKeyByValue(object) {
        let obj = languageTranslate.find(o => o.contactId === currentContactId[0]);
        if (obj === undefined || !obj.lang) {
            return 'N/A'; // 適切なデフォルト値を設定
        } else {
            return Object.keys(object).find(key => object[key] === obj.lang);
        }
    }

    const sendMessage = async(session, content) => {
        const awsSdkResponse = await session.sendMessage({
            contentType: "text/plain",
            message: content
        });
        const { AbsoluteTime, Id } = awsSdkResponse.data;
        console.log(AbsoluteTime, Id);
    }

    useEffect(() => {
        // 自動スクロール機能
        if (messageEl) {
            messageEl.current.addEventListener('DOMNodeInserted', event => {
                const { currentTarget: target } = event;
                target.scroll({ top: target.scrollHeight, behavior: 'smooth' });
            });
        }
        // フォーカスを常に入力欄に当てる
        input.current.focus();
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        // チャット入力欄が空なら何もしない
        if (newMessage === "") {
            return;
        }

        // 現在のコンタクトに対応する翻訳言語を取得
        let destLang = languageTranslate.find(o => o.contactId === currentContactId[0]);
        
        if (!destLang || !destLang.lang) {
            console.error("No destination language found or language is undefined for the current contact.");
            return;
        }

        console.log("destLang: ", destLang);

        // エージェントのメッセージを翻訳
        console.log(newMessage);
        let translatedMessageAPI = await translateTextAPI(newMessage, 'en', destLang.lang); // 外部のカスタム用語集を提供
        let translatedMessage = translatedMessageAPI.TranslatedText;

        console.log(` Original Message: ` + newMessage + `\n Translated Message: ` + translatedMessage);

        // チャットに追加する新しいメッセージを作成
        let data2 = {
            contactId: currentContactId[0],
            username: agentUsername,
            content: <p>{newMessage}</p>,
            translatedMessage: <p>{translatedMessage}</p>, // カスタム用語集使用時は {translatedMessage.TranslatedText} に設定
        };

        // 新しいメッセージをストアに追加
        addChat(prevMsg => [...prevMsg, data2]);

        // チャット入力欄をクリア
        setNewMessage("");

        // セッションを取得してメッセージ送信
        const session = retrieveValue(currentContactId[0]);

        function retrieveValue(key) {
            var value = "";
            for (var obj in props.session) {
                for (var item in props.session[obj]) {
                    if (item === key) {
                        value = props.session[obj][item];
                        break;
                    }
                }
            }
            return value;
        }

        sendMessage(session, translatedMessage);
    }

    return (
        <div className="chatroom">
            <h3>Translate - ({languageTranslate.map(lang => {if(lang.contactId === currentContactId[0])return lang.lang})}) {getKeyByValue(languageOptions)}</h3>
            <ul className="chats" ref={messageEl}>
                {
                    // 現在アクティブなチャットセッションのメッセージのみを表示
                    Chats.map(chat => {
                        if (chat.contactId === currentContactId[0])
                            return <Message chat={chat} user={agentUsername} />
                    })
                }
            </ul>
            <form className="input" onSubmit={handleSubmit}>
                <input
                    ref={input}
                    maxLength="1024"
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                />
                <input type="submit" value="Submit" />
            </form>
        </div>
    );
};

export default Chatroom;
