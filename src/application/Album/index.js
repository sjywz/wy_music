import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Container, TopDesc, Menu } from './style';
import Header from '@/baseUI/header/index';

import { CSSTransition } from 'react-transition-group';

import Scroll from '@/components/scroll/index';

import { getCount, isEmptyObject } from '@/api/utils';
import style from "@/assets/global-style";
import { connect } from 'react-redux';
import { changeEnterLoading, getAlbumList } from './store/actionCreators'
import Loading from '@/baseUI/loading/index';
import SongList from '@/application/SongList'
import MusicNote from '@/baseUI/music-note/index'

export const HEADER_HEIGHT = 45;

function Album(props) {
	const [showStatus, setShowStatus] = useState(true);
	const [isMarquee, setIsMarquee] = useState(false);
	const [title, setTitle] = useState("歌单");

	const headerEl = useRef();

	const id = props.match.params.id;
	const { currentAlbum: currentAlbumImmutable, enterLoading } = props;
	const { getAlbumDataDispatch } = props;

	const musicNoteRef = useRef ();

	const musicAnimation = (x, y) => {
		musicNoteRef.current.startAnimation ({ x, y });
	};

	const currentAlbum = currentAlbumImmutable.toJS();

	const handleBack = useCallback(() => {
		setShowStatus(false);
	}, []);

	const handleScroll = useCallback((pos) => {
		let minScrollY = -HEADER_HEIGHT;
		let percent = Math.abs(pos.y / minScrollY);
		let headerDom = headerEl.current;
		// 滑过顶部的高度开始变化
		if (pos.y < minScrollY) {
			headerDom.style.backgroundColor = style["theme-color"];
			headerDom.style.opacity = Math.min(1, (percent - 1) / 2);
			setTitle(currentAlbum.name);
			setIsMarquee(true);
		} else {
			headerDom.style.backgroundColor = "";
			headerDom.style.opacity = 1;
			setTitle("歌单");
			setIsMarquee(false);
		}
	}, [currentAlbum]);

	useEffect(() => {
		getAlbumDataDispatch(id);
	}, [getAlbumDataDispatch, id]);

	const renderTopDesc = () => {
		return (
			<TopDesc background={currentAlbum.coverImgUrl}>
				<div className="background">
					<div className="filter"></div>
				</div>
				<div className="img_wrapper">
					<div className="decorate"></div>
					<img src={currentAlbum.coverImgUrl} alt="" />
					<div className="play_count">
						<i className="iconfont play">&#xe62b;</i>
						<span className="count">{getCount(currentAlbum.subscribedCount)}</span>
					</div>
				</div>
				<div className="desc_wrapper">
					<div className="title">{currentAlbum.name}</div>
					<div className="person">
						<div className="avatar">
							<img src={currentAlbum.creator.avatarUrl} alt="" />
						</div>
						<div className="name">{currentAlbum.creator.nickname}</div>
					</div>
				</div>
			</TopDesc>
		)
	}

	const renderMenu = () => {
		return (
			<Menu>
				<div>
					<i className="iconfont">&#xe625;</i>
					评论
				</div>
				<div>
					<i className="iconfont">&#xe625;</i>
					点赞
				</div>
				<div>
					<i className="iconfont">&#xe625;</i>
					收藏
				</div>
				<div>
					<i className="iconfont">&#xe625;</i>
					更多
				</div>
			</Menu>
		)
	};

	return (
		<CSSTransition
			in={showStatus}
			timeout={300}
			classNames="fly"
			appear={true}
			unmountOnExit
			onExited={props.history.goBack}
		>
			<Container>
				<Header ref={headerEl} title={title} handleClick={handleBack} isMarquee={isMarquee}></Header>
				{isEmptyObject(currentAlbum) ? null : (
					<Scroll bounceTop={false} onScroll={handleScroll}>
						<div>
							{renderTopDesc()}
							{renderMenu()}
							<SongList 
								collectCount={currentAlbum.subscribedCount} 
								showCollect 
								songs={currentAlbum.tracks}
								musicAnimation={musicAnimation}
							/>
						</div>
					</Scroll>
				)}
				<MusicNote ref={musicNoteRef}></MusicNote>
				{enterLoading ? <Loading></Loading> : null}
			</Container>
		</CSSTransition>
	)
}

const mapStateToProps = (state) => ({
	currentAlbum: state.getIn(['album', 'currentAlbum']),
	enterLoading: state.getIn(['album', 'enterLoading']),
});
// 映射 dispatch 到 props 上
const mapDispatchToProps = (dispatch) => {
	return {
		getAlbumDataDispatch(id) {
			dispatch(changeEnterLoading(true));
			dispatch(getAlbumList(id));
		},
	}
};

export default connect(mapStateToProps, mapDispatchToProps)(React.memo(Album));