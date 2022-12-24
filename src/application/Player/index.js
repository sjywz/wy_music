import React, { useRef, useState, useEffect } from "react";
import { connect } from "react-redux";
import {
	changePlayingState,
	changeShowPlayList,
	changeCurrentIndex,
	changeCurrentSong,
	changePlayList,
	changePlayMode,
	changeFullScreen
} from "./store/actionCreators";
import MiniPlayer from "./MiniPlayer";
import NormalPlayer from "./normalPlayer";
import { getSongUrl, isEmptyObject, findIndex, shuffle } from "@/api/utils";
import { playMode } from '@/api/config';
import Toast from "@/baseUI/Toast/index";
import PlayList from "./PlayList";
import { getLyricRequest } from '@/api/request'
import Lyric from '@/api/lyric-parser';

function Player(props) {
	const {
		playing,
		currentSong: immutableCurrentSong,
		currentIndex,
		playList: immutablePlayList,
		mode,//播放模式
		sequencePlayList: immutableSequencePlayList,//顺序列表
		fullScreen
	} = props;

	const {
		toggleFullScreenDispatch,
		togglePlayingDispatch,
		changeCurrentIndexDispatch,
		changeCurrentDispatch,
		changePlayListDispatch,//改变playList
		changeModeDispatch,//改变mode
		togglePlayListDispatch
	} = props;

	const playList = immutablePlayList.toJS();
	const sequencePlayList = immutableSequencePlayList.toJS();
	const currentSong = immutableCurrentSong.toJS();

	const audioRef = useRef();
	const toastRef = useRef();
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [preSong, setPreSong] = useState({});
	const [modeText, setModeText] = useState("");
	const songReady = useRef(true);
	const currentLyric = useRef();
	const [currentPlayingLyric, setPlayingLyric] = useState("");
	const currentLineNum = useRef(0);

	const percent = isNaN(currentTime / duration) ? 0 : currentTime / duration;

	const changeMode = () => {
		let newMode = (mode + 1) % 3;
		if (newMode === 0) {
			//顺序模式
			changePlayListDispatch(sequencePlayList);
			let index = findIndex(currentSong, sequencePlayList);
			changeCurrentIndexDispatch(index);
			setModeText("顺序循环");
		} else if (newMode === 1) {
			//单曲循环
			changePlayListDispatch(sequencePlayList);
			setModeText("单曲循环");
		} else if (newMode === 2) {
			//随机播放
			let newList = shuffle(sequencePlayList);
			let index = findIndex(currentSong, newList);
			changePlayListDispatch(newList);
			changeCurrentIndexDispatch(index);
			setModeText("随机播放");
		}
		changeModeDispatch(newMode);
		toastRef.current.show();
	};

	const clickPlaying = (e, state) => {
		audioRef.current.play();
		e.stopPropagation();
		togglePlayingDispatch(state);
		if (currentLyric.current) {
			currentLyric.current.togglePlay(currentTime * 1000);
		}
	};

	const updateTime = e => {
		setCurrentTime(e.target.currentTime);
	};

	const onProgressChange = curPercent => {
		const newTime = curPercent * duration;
		setCurrentTime(newTime);
		audioRef.current.currentTime = newTime;
		if (!playing) {
			togglePlayingDispatch(true);
		}
		if (currentLyric.current) {
			currentLyric.current.seek(newTime * 1000);
		}
	};

	const handleLoop = () => {
		audioRef.current.currentTime = 0;
		changePlayingState(true);
		audioRef.current.play();
	};

	const handleEnd = () => {
		if (mode === playMode.loop) {
			handleLoop();
		} else {
			handleNext();
		}
	};

	const handlePrev = () => {
		//播放列表只有一首歌时单曲循环
		if (playList.length === 1) {
			handleLoop();
			return;
		}
		let index = currentIndex - 1;
		if (index < 0) index = playList.length - 1;
		if (!playing) togglePlayingDispatch(true);
		changeCurrentIndexDispatch(index);
	};

	const handleError = () => {
		songReady.current = true;
		alert("播放出错");
	};

	const handleNext = () => {
		//播放列表只有一首歌时单曲循环
		if (playList.length === 1) {
			handleLoop();
			return;
		}
		let index = currentIndex + 1;
		if (index === playList.length) index = 0;
		if (!playing) togglePlayingDispatch(true);
		changeCurrentIndexDispatch(index);
	};

	const handleLyric = ({ lineNum, txt }) => {
		if (!currentLyric.current) return;
		currentLineNum.current = lineNum;
		setPlayingLyric(txt);
	};

	const getLyric = id => {
		let lyric = "";
		if (currentLyric.current) {
			currentLyric.current.stop();
		}
		// 避免 songReady 恒为 false 的情况
		getLyricRequest(id)
			.then(data => {
				lyric = data.lrc.lyric;
				if (!lyric) {
					currentLyric.current = null;
					return;
				}
				currentLyric.current = new Lyric(lyric, handleLyric);
				currentLyric.current.play();
				currentLineNum.current = 0;
				currentLyric.current.seek(0);
			})
			.catch(() => {
				songReady.current = true;
				audioRef.current.play();
			});
	};

	useEffect(() => {
		if (
			!playList.length ||
			currentIndex === -1 ||
			!playList[currentIndex] ||
			playList[currentIndex].id === preSong.id ||
			!songReady.current// 标志位为 false
		) {
			return;
		}
		let current = playList[currentIndex];
		setPreSong(current);
		songReady.current = false; // 把标志位置为 false, 表示现在新的资源没有缓冲完成，不能切歌
		changeCurrentDispatch(current);// 赋值 currentSong
		audioRef.current.src = getSongUrl(current.id);
		togglePlayingDispatch(true);// 播放状态
		setCurrentTime(0);// 从头开始播放
		setDuration((current.dt / 1000) | 0);// 时长
		getLyric(current.id);
		setTimeout(() => {
			// 注意，play 方法返回的是一个 promise 对象
			audioRef.current.play().then(() => {
				songReady.current = true;
			});
		});
	}, [playList, currentIndex]);

	useEffect(() => {
		playing ? audioRef.current.play() : audioRef.current.pause();
	}, [playing]);

	return (
		<div>
			<audio
				ref={audioRef}
				onTimeUpdate={updateTime}
				onEnded={handleEnd}
				onError={handleError}
			></audio>
			<Toast text={modeText} ref={toastRef}></Toast>
			<PlayList />
			{!isEmptyObject(currentSong) && (<>
				<MiniPlayer
					song={currentSong}
					fullScreen={fullScreen}
					toggleFullScreen={toggleFullScreenDispatch}
					clickPlaying={clickPlaying}
					percent={percent}
					playing={playing}
					togglePlayList={togglePlayListDispatch}
				/>
				<NormalPlayer
					song={currentSong}
					fullScreen={fullScreen}
					toggleFullScreen={toggleFullScreenDispatch}
					clickPlaying={clickPlaying}
					percent={percent}
					playing={playing}
					duration={duration}//总时长
					currentTime={currentTime}//播放时间
					onProgressChange={onProgressChange}
					handlePrev={handlePrev}
					handleNext={handleNext}
					changeMode={changeMode}
					mode={mode}
					togglePlayList={togglePlayListDispatch}
					currentLyric={currentLyric.current}
					currentPlayingLyric={currentPlayingLyric}
					currentLineNum={currentLineNum.current}
				/>
			</>)}
		</div>
	)
}

// 映射 Redux 全局的 state 到组件的 props 上
const mapStateToProps = state => ({
	fullScreen: state.getIn(["player", "fullScreen"]),
	playing: state.getIn(["player", "playing"]),
	currentSong: state.getIn(["player", "currentSong"]),
	showPlayList: state.getIn(["player", "showPlayList"]),
	mode: state.getIn(["player", "mode"]),
	currentIndex: state.getIn(["player", "currentIndex"]),
	playList: state.getIn(["player", "playList"]),
	sequencePlayList: state.getIn(["player", "sequencePlayList"])
});

// 映射 dispatch 到 props 上
const mapDispatchToProps = dispatch => {
	return {
		togglePlayingDispatch(data) {
			dispatch(changePlayingState(data));
		},
		toggleFullScreenDispatch(data) {
			dispatch(changeFullScreen(data));
		},
		togglePlayListDispatch(data) {
			dispatch(changeShowPlayList(data));
		},
		changeCurrentIndexDispatch(index) {
			dispatch(changeCurrentIndex(index));
		},
		changeCurrentDispatch(data) {
			dispatch(changeCurrentSong(data));
		},
		changeModeDispatch(data) {
			dispatch(changePlayMode(data));
		},
		changePlayListDispatch(data) {
			dispatch(changePlayList(data));
		},
	};
};

// 将 ui 组件包装成容器组件
export default connect(
	mapStateToProps,
	mapDispatchToProps
)(React.memo(Player));