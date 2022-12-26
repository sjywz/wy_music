import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { getRankList } from './store/index';
import { filterIndex } from '@/api/utils';
import Scroll from '@/components/scroll';
import { Container, List, ListItem, SongList, EnterLoading } from './style';
import Loading from '@/baseUI/loading';
import { renderRoutes } from 'react-router-config'

const renderRankList = (list, enterDetail, global) => {	
	return <List globalRank={global}>
		{
			list.map((item) => {
				return (
					<ListItem 
						key={item.id} 
						tracks={item.tracks} 
						onClick={() => enterDetail(item)}
					>
						<div className="img_wrapper">
							<img src={item.coverImgUrl} alt="" />
							<div className="decorate"></div>
							<span className="update_frequecy">{item.updateFrequency}</span>
						</div>
						{renderSongList(item.tracks)}
					</ListItem>
				)
			})
		}
	</List>
}

const renderSongList = (list) => {
	return list.length ? (
		<SongList>
			{
				list.map((item, index) => {
					return <li key={index}>{index + 1}. {item.first} - {item.second}</li>
				})
			}
		</SongList>
	) : null;
}

const Index = (props) => {
	const { rankList: list, loading } = props;

	const { getRankListDataDispatch } = props;
	let rankList = list ? list.toJS() : [];

	let globalStartIndex = filterIndex(rankList);
	let officialList = rankList.slice(0, globalStartIndex);
	let globalList = rankList.slice(globalStartIndex);

	let displayStyle = loading ? { "display": "none" } : { "display": "" };

	const enterDetail = (detail) => {
		props.history.push (`/rank/${detail.id}`)
	}

	useEffect(() => {
		if(!list.size) {
			getRankListDataDispatch();
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <Container>
		<Scroll>
			<div>
				<h1 className="offical" style={displayStyle}> 官方榜 </h1>
				{renderRankList(officialList, enterDetail)}
				<h1 className="global" style={displayStyle}> 全球榜 </h1>
				{renderRankList(globalList, enterDetail, true)}
				{loading ? <EnterLoading><Loading></Loading></EnterLoading> : null}
			</div>
		</Scroll>
		{renderRoutes(props.route.routes)}
	</Container>
}

const mapStateToProps = (state) => ({
	rankList: state.getIn(['rank', 'rankList']),
	loading: state.getIn(['rank', 'loading']),
});

const mapDispatchToProps = (dispatch) => {
	return {
		getRankListDataDispatch() {
			dispatch(getRankList());
		}
	}
};

export default connect(mapStateToProps, mapDispatchToProps)(React.memo(Index));