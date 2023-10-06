const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');

const stompClient = require('./websocket-listener');

const follow = require('./follow'); // function to hop multiple links by "rel"
const root = '/api';

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


class App extends React.Component {

	constructor(props) {
		super(props);
		this.state = {players: [], attributes: [], page: 1, pageSize: 2, links: {}};
		this.onCreate = this.onCreate.bind(this);
		this.onUpdate = this.onUpdate.bind(this);
		this.onDelete = this.onDelete.bind(this);
		this.onNavigate = this.onNavigate.bind(this);
		this.updatePageSize = this.updatePageSize.bind(this);
		this.refreshCurrentPage = this.refreshCurrentPage.bind(this);
		this.refreshAndGoToLastPage = this.refreshAndGoToLastPage.bind(this);
	}

	loadFromServer(pageSize) {
		follow(client, root, [
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
		}).done(players => {
			this.setState({
				page: this.page,
				players: players,
				attributes: Object.keys(this.schema.properties),
				pageSize: pageSize,
				links: this.links});
		});
	}

	onCreate(newPlayer) {
		follow(client, root, [PLAYERS_ENDPOINT])
		.done(playerCollection => {
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
			method: 'PUT',
			path: getEntitySelfRefLink(player.entity),
			entity: updatedPlayer,
			headers: {
				'Content-Type': 'application/json',
				'If-Match': player.headers.Etag
			}
		}).done(response => {
			// WebSocket will update state
		}, response => {
			if (response.status.code === 412) {
				alert('Update on ' + getEntitySelfRefLink(player.entity) + ' failed. The Player you are trying to edit has been updated elsewhere.');
			}
		});
	}

	onDelete(player) {
		client({
			method: 'DELETE', 
			path: getEntitySelfRefLink(player.entity)
		});
	}
	
	onNavigate(navUri) {
		client({method: 'GET', path: navUri})
		.then(playerCollection => {
			this.links = playerCollection.entity._links;
			this.page = playerCollection.entity.page;
			return getEntitiesFromEmbeddedCollection(playerCollection.entity._embedded.players);
		}).done(players => {
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
		follow(client, root, [{
			rel: PLAYERS_ENDPOINT,
			params: {size: this.state.pageSize}
		}]).done(response => {
			if (response.entity._links.last !== undefined) {
				this.onNavigate(response.entity._links.last.href);
			} else {
				this.onNavigate(response.entity._links.self.href);
			}
		})
	}

	refreshCurrentPage(message) {
		follow(client, root, [{
			rel: PLAYERS_ENDPOINT,
			params: {
				size: this.state.pageSize,
				page: this.state.page.number
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
		stompClient.register([
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
				<CreateDialog attributes={this.state.attributes.filter(attribute => attribute !== 'id')} onCreate={this.onCreate}/>
				<PlayerList players={this.state.players}
					attributes = {this.state.attributes}
					links={this.state.links}
					page={this.state.page}
					pageSize={this.state.pageSize}
					onNavigate={this.onNavigate}
					updatePageSize={this.updatePageSize}
					onUpdate={this.onUpdate}
					onDelete={this.onDelete}
				/>
			</div>
		)
	}

}


class PlayerList extends React.Component{

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
		const pageSize = ReactDOM.findDOMNode(this.pageSize.current).value;
		if (/^[0-9]+$/.test(pageSize)) {
			this.props.updatePageSize(pageSize);
		} else {
			ReactDOM.findDOMNode(this.pageSize.current).value = pageSize.substring(0, pageSize.length - 1);
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
				onDelete={this.props.onDelete}/>
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


class Player extends React.Component{

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
				<td>
					<UpdateDialog player={this.props.player} 
						attributes={this.props.attributes.filter(attribute => attribute !== 'id')} 
						onUpdate={this.props.onUpdate}/>
				</td>
				<td>
					<button onClick={this.handleDelete}>Delete</button>
				</td>
			</tr>
		)
	}

}


class CreateDialog extends React.Component {

	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(e) {
		e.preventDefault();
		const newPlayer = {};
		this.props.attributes.forEach(attribute => {
			newPlayer[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
		});
		this.props.onCreate(newPlayer);

		// clear out the dialog's inputs
		this.props.attributes.forEach(attribute => {
			ReactDOM.findDOMNode(this.refs[attribute]).value = '';
		});

		// Navigate away from the dialog to hide it.
		window.location = "#";
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


class UpdateDialog extends React.Component {

	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(e) {
		e.preventDefault();
		const updatedPlayer = {};
		this.props.attributes.forEach(attribute => {
			updatedPlayer[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
		});
		this.props.onUpdate(this.props.player, updatedPlayer);
		window.location = "#";
	}

	render() {
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


ReactDOM.render(
	<App />,
	document.getElementById('react')
)