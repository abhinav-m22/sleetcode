import React, { useEffect, useState } from 'react';
import PreferenceNav from './PreferenceNav/PreferenceNav';
import Split from 'react-split';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { javascript } from '@codemirror/lang-javascript';
import EditorFooter from './EditorFooter';
import { Problem } from '@/utils/types/problem';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '@/firebase/firebase';
import { toast } from 'react-toastify';
import { problems } from '@/utils/problems';
import { useRouter } from 'next/router';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import useLocalStorage from '@/hooks/useLocalStorage';

type PlaygroundProps = {
    problem: Problem;
    setSuccess: React.Dispatch<React.SetStateAction<boolean>>;
    setSolved: React.Dispatch<React.SetStateAction<boolean>>;
};

export interface ISettings {
    fontSize: string;
    isSettingsOpen: boolean;
    isDropDownOpen: boolean;
}

const Playground: React.FC<PlaygroundProps> = ({ problem, setSuccess, setSolved }) => {

    const [user] = useAuthState(auth);

    const [activeTestCase, setActiveTestCase] = useState<number>(0);
    let [userCode, setUserCode] = useState<string>(problem.starterCode);
    
    const[fontSize, setFontSize] = useLocalStorage("slc-font-size", "16px");

    const[settings, setSettings] = useState<ISettings>({
        fontSize: fontSize,
        isSettingsOpen: false,
        isDropDownOpen: false,
    });

    const { query: { pid } } = useRouter();

    const handleSubmit = async () => {
        // alert('Submit');
        if (!user) {
            toast.error('Please login to submit your code!', {
                position: 'top-center',
                autoClose: 3000,
                theme: 'dark'
            });
            return;
        }
        try {

            userCode = userCode.slice(userCode.indexOf(problem.starterFunctionName))

            const cb = new Function(`return ${userCode}`)();
            const handler = problems[pid as string].handlerFunction;

            if (typeof handler === 'function') {
                const success = handler(cb);


                if (success) {
                    toast.success('Congratulations! You have successfully solved the problem.', {
                        position: 'top-center',
                        autoClose: 3000,
                        theme: 'dark'
                    });
                    setSuccess(true);
                    setTimeout(() => {
                        setSuccess(false);
                    }, 4000);
                }

                const userRef = doc(firestore, 'users', user.uid);
                await updateDoc(userRef, {
                    solvedProblems: arrayUnion(pid),
                });

                setSolved(true);
            }

        } catch (error: any) {
            // console.log(error);
            if (
                error.message.startsWith("AssertionError")
            ) {
                toast.error("Oops! One or more test cases failed", {
                    position: "top-center",
                    autoClose: 3000,
                    theme: "dark",
                });
            }
            else {
                toast.error(error.message, {
                    position: "top-center",
                    autoClose: 3000,
                    theme: "dark",
                });
            }
        }
    };

    useEffect(() => {
        const code = localStorage.getItem(`code-${pid}`);
        if (user) {
            setUserCode(code ? JSON.parse(code) : problem.starterCode);
        } else {
            setUserCode(problem.starterCode);
        }
    }, [pid, user, problem.starterCode]);

    const handleOnChange = (value: string) => {
        // console.log(value);
        setUserCode(value);
        localStorage.setItem(`code-${pid}`, JSON.stringify(value));
    };

    return (
        <div className='flex flex-col bg-dark-layer-1 relative overflow-x-hidden'>
            <PreferenceNav settings={settings} setSettings={setSettings} />

            <Split className='h-[calc(100vh-94px)]' direction='vertical' sizes={[60, 40]} minSize={60}>
                <div className='w-full overflow-auto'>
                    <CodeMirror
                        value={userCode}
                        theme={vscodeDark}
                        extensions={[javascript()]}
                        style={{ fontSize: settings.fontSize }}
                        onChange={handleOnChange}
                    />
                </div>
                <div className='w-full px-5 overflow-auto'>

                    {/* Testcases Heading */}

                    <div className='flex h-10 items-center space-x-6'>
                        <div className='relative flex h-full flex-col justify-center cursor-pointer'>
                            <div className='text-sm font-medium leading-5 text-white'>Testcases</div>
                            <hr className='absolute bottom-0 h-0.5 w-full rounded-full border-none bg-white' />
                        </div>
                    </div>

                    <div className='flex'>

                        {problem.examples.map((example, index) => (
                            <div className='mr-2 items-start mt-2 text-white' key={example.id}
                                onClick={() => setActiveTestCase(index)}
                            >
                                <div className='flex items-center flex-wrap gap-y-4'>
                                    <div className={`font-medium items-center transition-all focus:outline-none inline-flex 
                                bg-dark-fill-3 hover:bg-dark-fill-2 relative rounded-lg 
                                px-4 py-1 cursor-pointer whitespace-nowrap 
                                ${activeTestCase === index ? 'text-white' : 'text-gray-500'}
                                `}
                                    >
                                        Case {index + 1}
                                    </div>
                                </div>
                            </div>
                        ))}

                    </div>

                    <div className='font-semibold my-4'>
                        <p className='text-sm font-medium mt-4 text-white'>Input:</p>
                        <div className='w-full cursor-text rounded-lg border px-3 py-[10px] bg-dark-fill-3 border-transparent text-white mt-2'>
                            {problem.examples[activeTestCase].inputText}
                        </div>
                        <p className='text-sm font-medium mt-4 text-white'>Output:</p>
                        <div className='w-full cursor-text rounded-lg border px-3 py-[10px] bg-dark-fill-3 border-transparent text-white mt-2'>
                            {problem.examples[activeTestCase].outputText}
                        </div>
                    </div>

                </div>
            </Split>
            <EditorFooter handleSubmit={handleSubmit} />
        </div>
    );
}
export default Playground;