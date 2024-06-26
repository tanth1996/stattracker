import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import client from './client';

import register from './websocket-listener';

import follow from './follow'; // function to hop multiple links by "rel"

const endpointRoot = '/api';

const PLAYERS_ENDPOINT = 'players';


function getEntitySelfRefLink(entity) {
	return entity._links.self.href;
}


function getEntity(entity) {
	return client({
		method: 'GET',
		path: getEntitySelfRefLink(entity)
	});
}


function getEntitiesFromEmbeddedCollection(entityCollection) {
	return Promise.all(entityCollection.map(entity => getEntity(entity)));
}

type AppState = {players: any[]; attributes: any[]; page: number; pageSize: number; links: {}; loggedInUser: any; };

class App extends React.Component<any, AppState> {
	links: any;
	page: any;
	schema: any;

	constructor(props) {
		super(props);
		this.state = {players: [], attributes: [], page: 1, pageSize: 2, links: {}, loggedInUser: this.props.loggedInUser};
		this.onCreate = this.onCreate.bind(this);
		this.onUpdate = this.onUpdate.bind(this);
		this.onDelete = this.onDelete.bind(this);
		this.onNavigate = this.onNavigate.bind(this);
		this.updatePageSize = this.updatePageSize.bind(this);
		this.refreshCurrentPage = this.refreshCurrentPage.bind(this);
		this.refreshAndGoToLastPage = this.refreshAndGoToLastPage.bind(this);
	}

	loadFromServer(pageSize) {
		follow(client, endpointRoot, [
			{rel: PLAYERS_ENDPOINT, params: {size: pageSize}}]
		).then(playerCollection => {
			this.links = playerCollection.entity._links;
			this.page = playerCollection.entity.page;
			return playerCollection;
		}).then(playerCollection => {
			return client({
				method: 'GET',
				path: this.links.profile.href,
				headers: {'Accept': 'application/schema+json'}
			}).then(schema => {
				this.schema = schema.entity;
				return playerCollection;
			});
		}).then(playerCollection => {
			return getEntitiesFromEmbeddedCollection(playerCollection.entity._embedded.players);
		}).then(players => {
			this.setState({
				page: this.page,
				players: players,
				attributes: Object.keys(this.schema.properties),
				pageSize: pageSize,
				links: this.links});
		});
	}

	onCreate(newPlayer) {
		follow(client, endpointRoot, [PLAYERS_ENDPOINT])
		.then(playerCollection => {
			return client({
				method: 'POST',
				path: getEntitySelfRefLink(playerCollection.entity),
				entity: newPlayer,
				headers: {'Content-Type': 'application/json'}
			});
		});
	}

	onUpdate(player, updatedPlayer) {
		client({
			method: 'PATCH',
			path: getEntitySelfRefLink(player.entity),
			entity: updatedPlayer,
			headers: {
				'Content-Type': 'application/json',
				'If-Match': player.headers.Etag
			}
		}).then(response => {
			// WebSocket will update state
		}, response => {
			if (response.status.code === 403) {
				alert('You are not authorised to update ' + getEntitySelfRefLink(player.entity))
			}
			if (response.status.code === 412) {
				alert('Update on ' + getEntitySelfRefLink(player.entity) + ' failed. The Player you are trying to edit has been updated elsewhere.');
			}
		});
	}

	onDelete(player) {
		client({
			method: 'DELETE', 
			path: getEntitySelfRefLink(player.entity)
		}).then(response => {
			// WebSocket will update state
		}, response => {
		
			if (response.status.code === 403) {
				alert('You are not authorised to delete ' + getEntitySelfRefLink(player.entity))
			}
		});
	}
	
	onNavigate(navUri) {
		client({method: 'GET', path: navUri})
		.then(playerCollection => {
			this.links = playerCollection.entity._links;
			this.page = playerCollection.entity.page;
			return getEntitiesFromEmbeddedCollection(playerCollection.entity._embedded.players);
		}).then(players => {
			this.setState({
				page: this.page,
				players: players,
				attributes: this.state.attributes,
				pageSize: this.state.pageSize,
				links: this.links
			});
		});
	}
	
	updatePageSize(pageSize) {
		if (pageSize !== this.state.pageSize) {
			this.loadFromServer(pageSize);
		}
	}

	refreshAndGoToLastPage(message) {
		follow(client, endpointRoot, [{
			rel: PLAYERS_ENDPOINT,
			params: {size: this.state.pageSize}
		}]).then(response => {
			if (response.entity._links.last !== undefined) {
				this.onNavigate(response.entity._links.last.href);
			} else {
				this.onNavigate(response.entity._links.self.href);
			}
		})
	}

	refreshCurrentPage(message) {
		follow(client, endpointRoot, [{
			rel: PLAYERS_ENDPOINT,
			params: {
				size: this.state.pageSize,
				page: this.state.page
			}
		}]).then(playerCollection => {
			this.links = playerCollection.entity._links;
			this.page = playerCollection.entity.page;
			return getEntitiesFromEmbeddedCollection(playerCollection.entity._embedded.players);
		}).then(players => {
			this.setState({
				page: this.page,
				players: players,
				attributes: Object.keys(this.schema.properties),
				pageSize: this.state.pageSize,
				links: this.links
			})
		})
	}

	componentDidMount() {
		this.loadFromServer(this.state.pageSize);
		register([
			// PlayerEventHandler events
			{
				route: '/topic/newPlayer',
				callback: this.refreshAndGoToLastPage
			},
			{
				route: '/topic/updatePlayer',
				callback: this.refreshCurrentPage
			},
			{
				route: '/topic/deletePlayer',
				callback: this.refreshCurrentPage
			}
		]);
	}

	render() {
		return (
			<div>
				<CreateDialog attributes={this.state.attributes.filter(attribute => attribute !== 'id' && attribute !== 'user')} onCreate={this.onCreate}/>
				<PlayerList players={this.state.players}
					attributes = {this.state.attributes}
					links={this.state.links}
					page={this.state.page}
					pageSize={this.state.pageSize}
					onNavigate={this.onNavigate}
					updatePageSize={this.updatePageSize}
					onUpdate={this.onUpdate}
					onDelete={this.onDelete}
					loggedInUser={this.state.loggedInUser}
				/>
			</div>
		)
	}

}


class PlayerList extends React.Component<any, {}> {
	pageSize: React.RefObject<HTMLInputElement>;

	constructor(props) {
		super(props);
		this.handleNavFirst = this.handleNavFirst.bind(this);
		this.handleNavPrev = this.handleNavPrev.bind(this);
		this.handleNavNext = this.handleNavNext.bind(this);
		this.handleNavLast = this.handleNavLast.bind(this);
		this.pageSize = React.createRef();
		this.handlePageSizeUpdate = this.handlePageSizeUpdate.bind(this);
	}

	handlePageSizeUpdate(e) {
		e.preventDefault();
		const pageSize = (ReactDOM.findDOMNode(this.pageSize.current) as HTMLInputElement).value;
		if (/^[0-9]+$/.test(pageSize)) {
			this.props.updatePageSize(pageSize);
		} else {
			(ReactDOM.findDOMNode(this.pageSize.current) as HTMLInputElement).value = pageSize.substring(0, pageSize.length - 1);
		}
	}
	
	handleNavFirst(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.first.href);
	}

	handleNavPrev(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.prev.href);
	}

	handleNavNext(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.next.href);
	}

	handleNavLast(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.last.href);
	}

	render() {
		const pageInfo = this.props.page.hasOwnProperty("number") 
		? <h3>Players - Page {this.props.page.number + 1} of {this.props.page.totalPages}</h3> 
		: null;
		const players = this.props.players.map(player =>
			<Player key={getEntitySelfRefLink(player.entity)} 
				player={player} 
				attributes={this.props.attributes}
				onUpdate={this.props.onUpdate} 
				onDelete={this.props.onDelete}
				loggedInUser={this.props.loggedInUser}/>
		);

		const navLinks = [];
		if ("first" in this.props.links) {
			navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
		}
		if ("prev" in this.props.links) {
			navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
		}
		if ("next" in this.props.links) {
			navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
		}
		if ("last" in this.props.links) {
			navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
		}

		return (
			<div>
				{pageInfo}
				<input ref={this.pageSize} defaultValue={this.props.pageSize} onInput={this.handlePageSizeUpdate}/>
				<table>
					<tbody>
						<tr>
							<th>ID</th>
							<th>Display Name</th>
							<th>User</th>
						</tr>
						{players}
					</tbody>
				</table>
				<div>
					{navLinks}
				</div>
			</div>
		)
	}

}


class Player extends React.Component<any, {}> {

	constructor(props) {
		super(props);
		this.handleDelete = this.handleDelete.bind(this);
	}

	handleDelete() {
		this.props.onDelete(this.props.player);
	}

	render() {
		return (
			<tr>
				<td>{this.props.player.entity.id}</td>
				<td>{this.props.player.entity.displayName}</td>
				<td>{this.props.player.entity.user?.username}</td>
				<td>
					<UpdateDialog player={this.props.player} 
						attributes={this.props.attributes.filter(attribute => attribute !== 'id' && attribute !== 'user')} 
						onUpdate={this.props.onUpdate}
						loggedInUser={this.props.loggedInUser}/>
				</td>
				<td>
					<button onClick={this.handleDelete}>Delete</button>
				</td>
			</tr>
		)
	}

}


class CreateDialog extends React.Component<any, {}> {

	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(e) {
		e.preventDefault();
		const newPlayer = {};
		this.props.attributes.forEach(attribute => {
			newPlayer[attribute] = (ReactDOM.findDOMNode(this.refs[attribute]) as HTMLInputElement).value.trim();
		});
		this.props.onCreate(newPlayer);

		// clear out the dialog's inputs
		this.props.attributes.forEach(attribute => {
			ReactDOM.findDOMNode(this.refs[attribute]).nodeValue = '';
		});

		// Navigate away from the dialog to hide it.
		window.location.href = "#";
	}

	render() {
		const inputs = this.props.attributes.map(attribute =>
			<p key={attribute}>
				<input type="text" placeholder={attribute} ref={attribute} className="field"/>
			</p>
		);

		return (
			<div>
				<a href="#createPlayer">Create</a>

				<div id="createPlayer" className="modalDialog">
					<div>
						<a href="#" title="Close" className="close">X</a>

						<h2>Create new player</h2>

						<form>
							{inputs}
							<button onClick={this.handleSubmit}>Create</button>
						</form>
					</div>
				</div>
			</div>
		)
	}

}


class UpdateDialog extends React.Component<any, {}>  {

	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(e) {
		e.preventDefault();
		const updatedPlayer = {};
		this.props.attributes.forEach(attribute => {
			updatedPlayer[attribute] = (ReactDOM.findDOMNode(this.refs[attribute]) as HTMLInputElement).value.trim();
		});
		this.props.onUpdate(this.props.player, updatedPlayer);
		window.location.href = "#";
	}

	render() {
		const playerUser = this.props.player.entity.user;
		if (playerUser !== null && playerUser.username !== this.props.loggedInUser) {
			return (
				<div>
					<a>This player belongs to another user.</a>
				</div>
			)
		}

		const inputs = this.props.attributes.map(attribute =>
			<p key={this.props.player.entity[attribute]}>
				<input type="text" placeholder={attribute}
					   defaultValue={this.props.player.entity[attribute]}
					   ref={attribute} className="field"/>
			</p>
		);

		const dialogId = "updatePlayer-" + this.props.player.entity._links.self.href;

		return (
			<div key={this.props.player.entity._links.self.href}>
				<a href={"#" + dialogId}>Update</a>
				<div id={dialogId} className="modalDialog">
					<div>
						<a href="#" title="Close" className="close">X</a>

						<h2>Update a player</h2>

						<form>
							{inputs}
							<button onClick={this.handleSubmit}>Update</button>
						</form>
					</div>
				</div>
			</div>
		)
	}

};

const container = document.getElementById('react')
const root = createRoot(container)
root.render(
	<App loggedInUser={document.getElementById('username').innerHTML}/>
)