import React, { useState, useEffect } from 'react';
import Horizen from '@/baseUI/horizen-item';
import { categoryTypes, alphaTypes } from '@/api/config';
import { NavContainer, List, ListItem, ListContainer } from "./style";
import Scroll from '@/components/scroll';
import { connect } from 'react-redux';
import {
  getSingerList,
  getHotSingerList,
  changeEnterLoading,
  changePageCount,
  refreshMoreSingerList,
  changePullUpLoading,
  changePullDownLoading,
  refreshMoreHotSingerList
} from './store/actionCreators';
import Loading from '@/baseUI/loading';
import { renderRoutes } from 'react-router-config';

// 渲染函数，返回歌手列表
const renderSingerList = (singerList, enterDetail) => {
  return (
    <List>
      {
        singerList.map((item, index) => {
          return (
            <ListItem key={item.accountId + "" + index} onClick={() => enterDetail (item.id)}>
              <div className="img_wrapper">
                <img src={`${item.picUrl}?param=300x300`} width="100%" height="100%" alt="music" />
              </div>
              <span className="name">{item.name}</span>
            </ListItem>
          )
        })
      }
    </List>
  )
};

const Index = (props) => {
  let [category, setCategory] = useState('');
  let [alpha, setAlpha] = useState('');

  const { singerList, pageCount, pullUpLoading, pullDownLoading, enterLoading } = props;
  const { updateDispatch, getHotSingerDispatch, pullUpRefreshDispatch, pullDownRefreshDispatch } = props;

  let handleUpdateAlpha = (val) => {
    setAlpha(val);
    updateDispatch(category, val);
  };

  let handleUpdateCatetory = (val) => {
    setCategory(val);
    updateDispatch(val, alpha);
  };

  const handlePullUp = () => {
    pullUpRefreshDispatch(category, alpha, category === '', pageCount);
  };

  const handlePullDown = () => {
    pullDownRefreshDispatch(category, alpha);
  };

  const enterDetail = (id)  => {
    props.history.push(`/singers/${id}`);
  };

  useEffect (() => {
    if (!singerList.size) {
      getHotSingerDispatch ();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div>
    <NavContainer>
      <Horizen
        list={categoryTypes}
        title={"分类 (默认热门):"}
        handleClick={handleUpdateCatetory}
        oldVal={category}
      ></Horizen>
      <Horizen
        list={alphaTypes}
        title={"首字母:"}
        handleClick={handleUpdateAlpha}
        oldVal={alpha}
      ></Horizen>
    </NavContainer>
    <ListContainer>
      {enterLoading && <Loading></Loading>}
      <Scroll
        pullUp={handlePullUp}
        pullDown={handlePullDown}
        pullUpLoading={pullUpLoading}
        pullDownLoading={pullDownLoading}
      >
        {renderSingerList(singerList ? singerList.toJS() : [], enterDetail)}
      </Scroll>
    </ListContainer>
    { renderRoutes (props.route.routes) }
  </div>
}

const mapStateToProps = (state) => ({
  singerList: state.getIn(['singers', 'singerList']),
  enterLoading: state.getIn(['singers', 'enterLoading']),
  pullUpLoading: state.getIn(['singers', 'pullUpLoading']),
  pullDownLoading: state.getIn(['singers', 'pullDownLoading']),
  pageCount: state.getIn(['singers', 'pageCount'])
});

const mapDispatchToProps = (dispatch) => {
  return {
    getHotSingerDispatch() {
      dispatch(getHotSingerList());
    },
    updateDispatch(category, alpha) {
      dispatch(changePageCount(0));//由于改变了分类，所以pageCount清零
      dispatch(changeEnterLoading(true));//loading，现在实现控制逻辑，效果实现放到下一节，后面的loading同理
      dispatch(getSingerList(category, alpha));
    },
    // 滑到最底部刷新部分的处理
    pullUpRefreshDispatch(category, alpha, hot, count) {
      dispatch(changePullUpLoading(true));
      dispatch(changePageCount(count + 1));
      if (hot) {
        dispatch(refreshMoreHotSingerList());
      } else {
        dispatch(refreshMoreSingerList(category, alpha));
      }
    },
    //顶部下拉刷新
    pullDownRefreshDispatch(category, alpha) {
      dispatch(changePullDownLoading(true));
      dispatch(changePageCount(0));//属于重新获取数据
      if (category === '' && alpha === '') {
        dispatch(getHotSingerList());
      } else {
        dispatch(getSingerList(category, alpha));
      }
    }
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(React.memo(Index));