/* 
 * @author	Vishal Shah
 * Date		14 Jul 2017
 * 
 * Elision Dialer Widget
 * 
 * Dependency: http://www.malot.fr/bootstrap-datetimepicker/demo.php  
 */

//console.log("Console Logging of host_ip@dialer.js: " + host_ip);

$.widget('elision.dialer', {
  options: {
	  // Below are the default settings.
		VD_login				: "",
		VD_campaign				: "",
		phone_login				: "",
		phone_pass				: "",
		VD_pass					: "",
		apiuser					: "",			// api user - level 9
		apipass					: "",			// api pass
		loggedIn				: 0,
		agenturl				: "",			// remote url - dialer url
		apiurl					: "",			// dialshree agent api url
		adminapiurl				: "",			// dialshree agent api url - symlink
		el_apiurl				: "",			// Elision API URL
		modal_login				: "",
		modal_ingroups			: "",
		modal_manual_dial		: "",
		modal_pause_codes		: "",
		modal_disposition		: "",
		modal_transfer_call 	: "",
		modal_session_timeout 	: "",
		modal_datetimepicker 	: "",
		modal_notification		: "",
		counter					: 1,			// this is used when we get response from parent window
		incall					: 0,			// manualCalling function sets this to 1		
		call_id					: "",
		ingroups				: "",
		set_ingroups			: false,		//sets ingroups by default - won't show ingroups modal
		crm_url					: "",
		dids					: "",
		xfergroups				: "", 			//transfer groups
		live_agents				: "",
		onhook					: false,		// onhook dial method
		dial_method				: "",			// set campaign's dial method dynamically - RATIO or MANUAL
		widget_path				: "",
		incall_crm_url			: "",
		disable_pausecode		: false,
		dial_next				: false,
		manual_recording		: "",
		webform					: 0,
		webform_url_set			: 0,
		recording				: 0, // recording status 1 means currently recording and 0 means not recording
		bucket                  : false, // set bucket by default it is false , false means no bucket is there in campaign
		campaign_callback       : "" // Added By Puja Gediya
  },
 
  _create: function () {
	  // validates mandatory fields
	  this._validate({	VD_login: 		this.options.VD_login, 
		  				VD_pass : 		this.options.VD_pass, 
		  				VD_campaign:	this.options.VD_campaign,
						widget_path: 	this.options.widget_path
	  				});
	  
	  $.ajax({
		  url		:		this.options.widget_path + '/dialshree/main.php',
		  data		:		{"api":"config"},
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( result ) {
			if (!result.success) {
				throw new Error("Config file is missing in dialer login function.");
				return this;
			}
			//console.log (result);
			var env = result.data.env;
			
			if (env == 'production') {
				this._setOption("agenturl", result.data.production.agenturl);
				this._setOption("apiurl", result.data.production.apiurl);
				this._setOption("adminapiurl", result.data.production.adminapiurl);
				this._setOption("el_apiurl", result.data.production.el_apiurl);
				if (result.data.production.set_ingroups == "1")
					this._setOption("set_ingroups", true);
				this._setOption("onhook", result.data.production.onhook);
				this._setOption("apiuser", result.data.production.apiuser);
				this._setOption("apipass", result.data.production.apipass);
				this._setOption("incall_crm_url", result.data.production.incall_crm_url);
				this._setOption("webform", result.data.production.webform);
			}
			else{
				this._setOption("agenturl", result.data.development.agenturl);
				this._setOption("apiurl", result.data.development.apiurl);
				this._setOption("adminapiurl", result.data.development.adminapiurl);
				this._setOption("el_apiurl", result.data.development.el_apiurl);
				
				if (result.data.development.set_ingroups == "1")
					this._setOption("set_ingroups", true);
				this._setOption("onhook", result.data.development.onhook);
				this._setOption("apiuser", result.data.development.apiuser);
				this._setOption("apipass", result.data.development.apipass);
				this._setOption("incall_crm_url", result.data.development.incall_crm_url);
				this._setOption("webform", result.data.development.webform);
			}
			
			var url = this.options.agenturl + 'relogin=YES&VD_login='+this.options.VD_login+'&VD_campaign='+this.options.VD_campaign+'&phone_login='+this.options.phone_login+'&phone_pass='+this.options.phone_pass+'&VD_pass='+this.options.VD_pass;
			 this._setOption("agenturl", url);
		}, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
		  }, this));
	  
	  
	  
	  // when user clicks on the selector
	  this._on( this.element, {
		  "click": this._validateLicense,
		});
	  
	  $("head").append('<script type="text/javascript" src="js/datetimepicker/bootstrap-datetimepicker.min.js"></script>');
	  $("head").append('<link rel="stylesheet" type="text/css" href="js/datetimepicker/bootstrap-datetimepicker.min.css"></link>');
	},
  
  isLoggedIn: function() {
	  if (this.options.loggedIn === 1) { 
	  	return true; 
	  }
	  return false;
  },
  
  call: function( phone_code, number ) {
	  if (phone_code == "undefined") { phone_code = "";}
	  if( this.options.loggedIn === 0 ) {
		  this._showNotificationModal ("ERROR: Agent not logged in!", "danger", true);
		  return false;
	  }
	  if( this.options.agent_status != "PAUSED" ) {
		  this._showNotificationModal ("ERROR: Agent should be in Pause mode", "danger", true);
		  return false;
	  }
	  if( this.options.incall === 1 ) {
		  this._showNotificationModal ("ERROR: Already in call.", "danger", true);
		  return false;
	  }
	  // set default phone_code
	  if (phone_code.length == 0) {
		  phone_code = "";
	  }
	  
	  /* ---------------------------------------------------------------------------- */
	  /* Vinay - Modal type commented & changed from 'danger' to 'success'            */
	  /* ---------------------------------------------------------------------------- */
	  // this._showNotificationModal ("Calling " + number, "danger", true);
	  this._showNotificationModal ("Calling " + number, "success", true); 

	  var params = {"api":"click_to_call","phone_key":number,"phone_code":phone_code,"agent_user":this.options.VD_login,"dial_method":this.options.dial_method, "on_hook_agent":0, "number_encryption": 0};
	  $.ajax({
		  url		:		this.options.el_apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( result ) {
			console.log (params + " click_to_call set");
		}, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
		  }, this));
  },
  _validateLicense: function() {
	  var params = {"api":"validate_license"};
	  $.ajax({
		  url		:		this.options.el_apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( result ) {
			  if(result.success == true) {
				  if (result.data === false) {
					  this._showNotificationModal ("License error: Exceeded the limit of concurrent agents", "danger", true);
					  return false;
				  }
				  this._alreadyLoggedIn();
				  return true;
			  }else {
				  console.log (result);
				  this._showNotificationModal (result, "danger", true);
				  return false;
			  }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
		  }, this));
	  
  },  
  _alreadyLoggedIn: function() {
	  var params = {"api":"already_logged_in","agent_user":this.options.VD_login,"phone_login":this.options.phone_login};
	  $.ajax({
		  url		:		this.options.el_apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( result ) {
			  if(result.success == true) {
				  if (result.data === true) {
					  this._showNotificationModal ("ERROR: Agent " + this.options.VD_login + " already logged in", "danger", true, true);
					  return false;
				  }
				  this._login();
				  return true;
			  }else {
				  console.log (result);
				  this._showNotificationModal (result, "danger", true);
				  return false;
			  }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
		  }, this));
	  
  },
  
  _login: function() {
	// set up the iframe
	var iframe = '<iframe id="dialer" src="'+this.options.agenturl+'" width="100%" frameborder="0" style="height:50vh;"></iframe>';
	//  var iframe = '<input size="16" type="text" value="2012-06-15 14:45" readonly class="form_datetime">';
	this._modal ("modal_login", "Select your campaign","Dialer version 1.1", "", iframe, "login", 1);
	
	
	// remove if iframe already exists
	if($("#dialer").length) {
		$("#dialer").remove();
	} 
	
	$(this.options.modal_login).insertAfter(this.element);
	
	$("#modal_login").modal("show");
	
	// Create IE + others compatible event handler
	var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
	var eventer = window[eventMethod];
	var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
	this._setOption("counter",1);
	
	// Listen to message from child window
	eventer(messageEvent,this._eventReceived.bind(this),false);
	
  },
  _eventReceived: function(e) {
	  if(e.data.action == "closeModal" && this.options.counter == 1) {
		  	this._setOption("VD_campaign", e.data.campaign_id); // this is coming from agent/index.php file
			$('#modal_login').modal("hide");
			this._setOption ("counter", 2);
			this._loggedIn();
	}
  },
  _loggedIn: function () {
	  this._setOption ("loggedIn", 1);
	  this._listLiveAgents("");
	  this._listBucket(); /*Added By Puja Gediya*/
	  this._listIngroups();
	  this._listXfergroups();
	  this._listDID();

	  this.element.attr("disabled","disabled");
	  this.element.html(this.options.VD_login +"-"+this.options.VD_campaign);
	  this._addButton("agent-status");
	  this._addButton("logout");
	  this._addButton("hangup");
	  this._allowedManualDial();
	  this._allowedChooseBlended(); // Added By Puja Gediya On 27/09/2018 To check whether agent have permission to choose blended or not

	  //this._addButton("manual-dial");
	  if(!this.options.set_ingroups) {
		  this._addButton("ingroups");
	  }
	  
	  this._addButton("park-call");
	  this._addButton("transfer-call");
	  if(this.options.webform == '1') {
		  this._addButton("webform");
	  }
	  this._checkCampaignRecording();
	  // check the dial method and add the button respectively
	  this._checkDialMethod();
	/*  this._addButton("stop");
	  this._addButton("start");*/
	  
	  this._addButton("callbacks");


	  $(window).bind('beforeunload', function(){
		    return 'Are you sure you want to close this window? \nDialer will stop working.';
		});
	  
	  this.interval = setInterval(function() { this._agentStatus("setoption") }.bind(this),2000); // 2 second
	  /* Uncomment following line of code which checks agent session every 10 seconds - this is commented so TPS can run on hook */
	  
	  this.session_interval = setInterval(function() { this._agentSession("setoption") }.bind(this),10000); //10 seconds
  },
  
  _addButton: function ( button ) {
	  
	  switch( button ) 
	  {
	  	case "webform":
  		  // insert logout button
	  	  var webform = '<a href="javascript:void(0)" id="webform" class="btn btn-info" target="_blank" disabled>Webform</a>';
	  	  $(webform).insertAfter(this.element);
	  	  break;
	  	case "logout":
	  		  // insert logout button
		  	  var logout = '<button type="button" class="btn btn-danger" id="exitDialer">Logout</button>';
		  	  $(logout).insertAfter(this.element);
		  	  this._on( "#exitDialer", {
		  		  "click": function(e) {
		  			  			this._agentStatus("logout");
		  			  			},
		  		});
		  	  break;
		
	  	case "ingroups":
	  		var groups = '<button type="button" class="btn btn-info" id="btn-groups">Inbound Process</button>';
		  	  $(groups).insertAfter(this.element);
		  	  this._on( "#btn-groups", {
		  		  "click": function (e) {
		  			 $("#modal_ingroups").modal("show");
		  		  },
		  		});
	  		break;
	  		
	  	case "start":
	  		var start = '<button type="button" class="btn btn-info" id="btn-start">Start</button>';
		  	  $(start).insertAfter(this.element);
		  	  this._on( "#btn-start", {
		  		  "click": this._startCalling,
		  		});
	  		break;
	  		
	  	case "stop":
	  		var stop = '<button type="button" class="btn btn-info" id="btn-stop" disabled>Stop</button>';
		  	  $(stop).insertAfter(this.element);
		  	  this._on( "#btn-stop", {
		  		  "click": this._stop,
		  		});
	  		break;
	  	
	  	case "start-recording":
		  	var startrecording = '<button type="button" class="btn btn-info" id="btn-start-recording" disabled>Start Recording</button>';
		  	  $(startrecording).insertAfter(this.element);
		  	  this._on( "#btn-start-recording", {
		  		  "click": this._startrecording,
		  		});
	  		
	  		break;
	  	case "stop-recording":
	  		var stoprecording = '<button type="button" class="btn btn-info" id="btn-stop-recording" disabled>Stop Recording</button>';
		  	  $(stoprecording).insertAfter(this.element);
		  	  this._on( "#btn-stop-recording", {
		  		  "click": this._stoprecording,
		  		});
	  		break;

	  	case "dial-next":
	  		var dialnext = '<button type="button" class="btn btn-info" id="btn-dial-next" disabled>Dial Next</button>';
		  	  $(dialnext).insertAfter(this.element);
		  	  this._on( "#btn-dial-next", {
		  		  "click": this._dialNext,
		  		});
	  		break;
	  		
	  	case "manual-dial":
	  		var manual = '<button type="button" class="btn btn-info" id="btn-manual-dial">Manual Dial</button>';
		  	  $(manual).insertAfter(this.element);
		  	  this._on( "#btn-manual-dial", {
		  		  "click": this._showManualDialModal,
		  		});
	  		break;
	  		
	  	case "hangup":
	  		var hangup = '<button type="button" class="btn btn-danger" id="btn-hangup" disabled="disabled">Hangup</button>';
		  	  $(hangup).insertAfter(this.element);
		  	  this._on( "#btn-hangup", {
		  		  "click": this._endManualCall,
		  		});
	  		break;

	  	case "agent-status":

			// Vinay - Code Customization - 30-03-2017
			var agc_status_btn = '<button class="btn btn-default active" id="btn-agent-status">NO LIVE CALL</button> <button class="btn btn-danger" id="btn-ping-status"></button><mark class="small">v1.1</mark>';
			var agentstatus = '<span class="pull-right" id="agc_status">'+agc_status_btn+'</span>';
			
			// Check before inserting above agentstatus
			console.log("agc_status length: "  + $("#agc_status").length);
			if( $("#agc_status").length < 1 ) {
		  	  $(agentstatus).insertAfter($(this.element).closest("div"));
			}else{
				$("#agc_status").empty().prepend(agc_status_btn);
			}
	  		break;
	  		
	  	case "park-call":
	  		var park = '<button type="button" class="btn btn-info" id="btn-park-call" disabled="disabled" data-toggle="park">Park Call</button>';
		  	  $(park).insertAfter( this.element );
		  	  this._on( "#btn-park-call", {
		  		  "click": this._parkGrabCall,
		  		});
	  		break;
	  		
	  	case "transfer-call":
	  		var transfer = '<button type="button" class="btn btn-info" id="btn-transfer-call" disabled="disabled">Transfer Call</button>';
		  	  $(transfer).insertAfter( this.element );
		  	  this._on( "#btn-transfer-call", {
		  		  "click": this._showTransferCallModal,
		  		});
	  		break;

	  	/*case "callbacks":
	  		var transfer = '<button type="button" class="btn btn-info" style="float:right;" id="btn-callbacks" style="display:none;">Call Backs</button>';
		  	  $(transfer).insertAfter( this.element );
		  	  this._on( "#btn-callbacks", {
		  		  "click": this._listCallBacks,
		  		});
	  		break;	*/
	  		
	  	default:
	  		break;
	  }
	 
  },
  
  logout: function() {
  	  /* ---------------------------------------------------------------------------- */
	  /* Vinay - 01-03-2017 - Not allowed to logout from Dialer Widget from if agent in call */
	  /* 'logout' function is also called from static page - when vtiger logout is there during live call */
	  /* ---------------------------------------------------------------------------- */
  	  if( this.options.incall === 1 ) {
		this._showNotificationModal ("ERROR: You are in call now.", "danger", true);
		return false;
	  }

	  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"logout", "value":"LOGOUT"};
	 
	  $.ajax({
		  url		:		this.options.apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( data ) {
			// console.log(data);
			 if (this._hasSuccess (data)) {
				 this._setOption ("loggedIn", 0);
				 this._hideButtons();
				 // clear session_data 
				 $.post(this.options.el_apiurl, {"api":"clear_session","agent_user":this.options.VD_login}).done($.proxy(function( data ) {

				  }, this));
			 }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
		  }, this));
	  
	  // stop the script which checks agent_status every 2 seconds
	  clearInterval (this.interval);
	  clearInterval (this.session_interval);
  },
  
  _agentSession: function ( postCheck ) {
	  var params = {"api":"check_session","phone_login":this.options.phone_login};
	 
	  $.ajax({
		  url		:		this.options.el_apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( result ) {
			if(result.success == true) {
				  if(result.data === false){
					  this._showSessionTimeoutModal();
				  } 
			  }else {
				  console.log (result);
			  }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
		  }, this));
	  
  },
  _agentStatus: function( postCheck ) {
	  // This function is using admin api
	  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"agent_status", "stage":"csv","header":"NO","token":Date.now() };

	  $.ajax({
		  url		:		this.options.adminapiurl,
		  data		:		params,
		  type		:		"post",
		  timeout	:		30000
		})
		.done($.proxy( function ( data ) {

			/* ---------------------------------------------------------------------------------- */
			/* Vinay - 20-05-2017 - Prevent Vtiger CRM Logout during In-Call Status               */
			/* ---------------------------------------------------------------------------------- */
//			var crm_logout = $("iframe#innerframecont").contents().find("a#menubar_item_right_LBL_SIGN_OUT");
//			if( this.options.incall === 1 ) {
//				crm_logout.html('You are in call now.');
//				crm_logout.attr('href', 'javascript:void(0)');
//			}else {
//				crm_logout.html('Sign Out');
//				crm_logout.attr('href', '?module=Users&parent=Settings&action=Logout');
//			}
			/* --------------------------------------------------------------------------------- */

			// if agent is not logged in or forced logout
			if ( data.search ("AGENT NOT LOGGED IN") > 0) {
				 this._setOption ("loggedIn", 0);
				 this._hideButtons();
				 // stop the script which checks agent_status every 2 seconds
				 clearInterval (this.interval);
				 clearInterval (this.session_interval);
				 return false;
			}
			 var status = data.split(",");
			
			 // status[10] is phone_number
			 // status[9] is substatus like PARK, DEAD
                           console.log(status);
			 if( $.trim(status[0]) === "INCALL") 
			 {

			 	 this._setOption("incall",1);
			 	 if (this.options.recording == 1) {
			 		 $("#btn-stop-recording").removeAttr("disabled");
			 		 $("#btn-start-recording").attr("disabled", "disabled");
			 	 } else {
			 		 $("#btn-start-recording").removeAttr("disabled");
			 		 $("#btn-stop-recording").attr("disabled", "disabled");
			 	 }
			 	 if(this.options.webform == "1") {
			 		 if(!this.options.webform_url_set) {
			 			
			 			var params = {"api":"get_webform_url","phone_number":status[10],"campaign_id":this.options.VD_campaign, "agent_user":this.options.VD_login};
			 			 
			 			  $.ajax({
			 				  url		:		this.options.el_apiurl,
			 				  data		:		params,
			 				  type		:		"POST",
			 				  timeout	:		30000
			 				})
			 				.done($.proxy( function ( result ) {
			 					if(result.success == true) {
			 						  if(result.data){
			 							 $("#webform").removeAttr("disabled");
			 							 $("#webform").attr("href",result.data); //set the parsed url returned by the api
			 							 console.log (result.data);
			 							 this._setOption("webform_url_set",1);
			 						  } 
			 					  }else {
			 						  console.log (result);
			 					  }
			 				  }, this))
			 				  .fail($.proxy( function ( error ) { 
			 					  console.log(error);  
			 				  }, this));
			 			 
			 		 }
			 	 } else {
			 		 console.log("webform 0");
			 	 }
			 	 
				 console.log("status:" + status[9]);

				 switch (status[9])
				 {
				 	case "PARK":
				 		$("#btn-transfer-call").attr("disabled","disabled");
				 		$("#btn-park-call").removeAttr("disabled");
				 		break;
				 	
				 	case "DEAD":
				 		$("#btn-agent-status").html ("DEAD");
				 		$("#btn-agent-status").attr ("class","btn btn-danger");
				 		$("#btn-transfer-call").attr("disabled","disabled");
				 		$("#btn-park-call").attr("disabled","disabled");
				 		
				 		break;

				 	case "3-WAY":
				 		$("#btn-hangup").removeAttr("disabled");
				 		$("#btn-agent-status").html ("LIVE CALL");
				 		$("#btn-agent-status").attr ("class","btn btn-success active");
				 		$("#btn-transfer-call").removeAttr("disabled");
				 	 	$("#btn-park-call").removeAttr("disabled");
					 	$("#btn-start").attr("disabled","disabled");
					 	$("#btn-dial-next").attr("disabled","disabled");
					 	$("#btn-stop").attr("disabled","disabled");
					 	$("#btn-manual-dial").attr("disabled","disabled");
                      break;

				 	// Added By Puja Gediya On 21/09/2018	For shownig live call only when call answer else show no live call and accordingly enable disable all buttons
				 	case "DIAL":
				 		$("#btn-agent-status").html ("NO LIVE CALL");
				 		$("#btn-transfer-call").attr("disabled","disabled");
				 		$("#btn-park-call").attr("disabled","disabled");
				 		$("#btn-hangup").removeAttr("disabled"); 
				 		$("#btn-start").attr("disabled","disabled");
					 	$("#btn-dial-next").attr("disabled","disabled");
					 	$("#btn-stop").attr("disabled","disabled");
					 	$("#btn-manual-dial").attr("disabled","disabled");
				 		
				 		break;

				 	case "":
				 		
				 		$("#btn-agent-status").html ("LIVE CALL");
				 		$("#btn-agent-status").attr ("class","btn btn-success active");
					 	$("#btn-hangup").removeAttr("disabled"); 
					 	$("#btn-transfer-call").removeAttr("disabled");
				 	 	$("#btn-park-call").removeAttr("disabled");
					 	$("#btn-start").attr("disabled","disabled");
					 	$("#btn-dial-next").attr("disabled","disabled");
					 	$("#btn-stop").attr("disabled","disabled");
					 	$("#btn-manual-dial").attr("disabled","disabled");

					 	break;
				 			
				 	default:

				 		$("#btn-transfer-call").removeAttr("disabled");
				 	 	$("#btn-park-call").removeAttr("disabled");
				 		break;
				 }
				 
				 
//				 if( status[9] === "PARK") {
//					 $("#btn-transfer-call").attr("disabled","disabled");
//				 } else{
//					 $("#btn-transfer-call").removeAttr("disabled");
//				 }
				 if( status[1].length > 1 && status[1] != this.options.call_id) { 
					 this._setOption("call_id",status[1]);
					 //$("#innerframecont").attr("src","http://crm.thephonesupport.in/test_crm/inbound.php?phone_number=" + status[10]);
					 //var crmurl = 'http://crm.thephonesupport.in/'+this.options.crm_url+'/inbound.php?phone_number=' + status[10];

					 // Vinay - 20-05-2017 - Inzzi
					 var ph_num = status[10];
					 if( ph_num == '' ) ph_num = status[11];

					 var crmurl = this.options.incall_crm_url + ph_num;
					 

					 $("#innerframecont").attr("src",crmurl);
					 console.log("Sent to iframe: " + crmurl);
				 }
				 
				 
			 }
			 else if ($.trim(status[0]) === "READY" || $.trim(status[0]) === "CLOSER"){
				 $("#btn-start").attr("disabled","disabled");
				 $("#btn-dial-next").removeAttr("disabled");
				 $("#btn-manual-dial").attr("disabled","disabled");
				 $("#btn-stop").removeAttr("disabled");
				 $("#btn-hangup").attr("disabled","disabled");
				 $("#btn-agent-status").html ("READY");
				 $("#btn-agent-status").attr ("class","btn btn-default");
				 $("#btn-park-call").attr("disabled","disabled");
				 $("#btn-transfer-call").attr("disabled","disabled");
				 this._setOption("incall",0);
				 $("#btn-stop-recording").attr("disabled","disabled");
		 		 $("#btn-start-recording").attr("disabled", "disabled");
		 		 //$("#webform").attr("disabled","disabled");
			 }
			 else {
				 $("#btn-hangup").attr("disabled","disabled");
				 if ($.trim(status[0]) === "PAUSED" && status[8].length > 0) {
					 $("#btn-agent-status").html (status[8]);
				 }else{
					 $("#btn-agent-status").html ("NO LIVE CALL");
				 }
				 $("#btn-agent-status").attr ("class","btn btn-default");
				 $("#btn-park-call").attr("disabled","disabled");
				 $("#btn-transfer-call").attr("disabled","disabled");
				 $("#btn-start").removeAttr("disabled");
				 $("#btn-dial-next").removeAttr("disabled");
				 $("#btn-stop").attr("disabled","disabled");
				 $("#btn-manual-dial").removeAttr("disabled");
				 // Added By Puja on 15/09/2017 ; When Agent is paused Web-form Button Should Be Disable.
				 $("#webform").attr("disabled","disabled");
				 this._setOption("webform_url_set",0);

				 this._setOption("incall",0);
			 }
			 if ( postCheck == "logout") {
			 	 if ($.trim(status[0]) === "INCALL" || $.trim(status[0]) === "DISPO") {
					 alert("Looks like you are in call or on disposition screen! Not able to logout until call ends.");
					 return false;
				 }

				 this.logout();
			 }
			 $("#btn-ping-status").hide();
			 if ( postCheck == "setoption") {
				 this._setOption("agent_status",$.trim(status[0]));
				 
				 return true;
			 }
			 
			 return $.trim(status[0]); 
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
			  $("#btn-ping-status").show();
			  $("#btn-ping-status").html('Alert: Network is flaky.');
		  }, this));
  },
  
  _hideButtons: function () {
	  $("#exitDialer").hide().remove();
	  $("#btn-groups").hide().remove();
	  $("#btn-start").hide().remove();
	  $("#btn-dial-next").hide().remove();
	  $("#btn-stop").hide().remove();
	  $("#btn-manual-dial").hide().remove();
	  $("#btn-hangup").hide().remove();
	  $("#btn-agent-status").hide().remove();
	  $("#btn-ping-status").hide().remove();
	  $("#btn-park-call").hide().remove();
	  $("#btn-transfer-call").hide().remove();
	  $("#modal_ingroups").remove();
	  $("#btn-stop-recording").hide().remove();
	  $("#btn-start-recording").hide().remove();
	  $("#webform").hide().remove();
	  $("#btn-callbacks").hide().remove();
	  
	  this.element.removeAttr("disabled");
	  this.element.html("Access Dialer");
  },
  
  _listIngroups: function() {
	  $("#btn-groups").hide();
	  var set_ingroups = this.options.set_ingroups;
	  var params = {"api":"list_ingroups","campaign_id":this.options.VD_campaign,"set_ingroups":set_ingroups,"agent_user":this.options.VD_login};
	  //this._setOption("set_ingroups",set_ingroups);
	  
	  $.ajax({
		  url		:		this.options.el_apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( result ) {
			if(result.success == true) {
				  this._setOption("ingroups",result.data);
				  if (!set_ingroups) {
					  $("#btn-groups").show();
					  this._showIngroupsModal (result.data);
				  }
			  }else {
				  console.log (result);
			  }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
			  //Rollbar.error("Error while calling URL: " + this.options.el_apiurl+" with params: "+ JSON.stringify(params) + " error log: " + JSON.stringify(error));
		  }, this));
	  
  },
  _listXfergroups: function() {
	  var params = {"api":"list_xfergroups","campaign_id":this.options.VD_campaign};
	  $.ajax({
		  url		:		this.options.el_apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( result ) {
			if(result.success == true) {
				  this._setOption("xfergroups",result.data);
				  //this._showTransferCallModal();
				  //return;
			  }else {
				  console.log (result);
			  }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
			  //Rollbar.error("Error while calling URL: " + this.options.el_apiurl+" with params: "+ JSON.stringify(params) + " error log: " + JSON.stringify(error));
		  }, this));
  },
  _listLiveAgents: function( reload ) {
	  var params = {"api":"list_agents","campaign_id":this.options.VD_campaign,"agent_user":this.options.VD_login};
	  $.ajax({
		  url		:		this.options.el_apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( result ) {
			if(result.success == true) {
				  this._setOption("live_agents",result.data);
				  // if render is true - vishal-
				  if (reload === "render") {
					  var html = '<option value=""></option>';
					  $.each(this.options.live_agents, function(index, agent) {
						  html += '<option value="'+agent["id"]+'">'+agent["name"]+'</option>';
					  });
					  $("#sel_agent").empty().append(html);
				  } else {
					  //alert("not reloading");
				  }
				  //this._showTransferCallModal();
				  //return;
			  }else {
				  console.log (result);
			  }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
			  //Rollbar.error("Error while calling URL: " + this.options.el_apiurl+" with params: "+ JSON.stringify(params) + " error log: " + JSON.stringify(error));
		  }, this));
  },
  _listDID: function() {
	  var params = {"api":"list_agents","campaign_id":this.options.VD_campaign,"agent_user":this.options.VD_login};
	  $.ajax({
		  url		:		this.options.el_apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( result ) {
			if(result.success == true) {
				  this._setOption("dids",result.data);
			  }else {
				  console.log (result);
			  }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
		  }, this));
	  
  },
  _listPauseCodes: function() {
	  if (document.getElementById("modal_pause_codes")) {
		  $("#modal_pause_codes").modal("show");
		  return;
	  }
	  var params = {"api":"list_pause_codes","campaign_id":this.options.VD_campaign};
	  
	  $.ajax({
		  url		:		this.options.el_apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( result ) {
			if(result.success == true && Object.keys(result.data).length > 0) {
				  this._showPauseCodesModal (result.data);
			  }else {
				  console.log (result);
				  return false;
			  }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
		  }, this));
  },
/* Added By Puja Gediya For Bucket On 24/02/2018 */
  _listBucket : function(){

  	var params = {"api":"list_bucket","campaign_id":this.options.VD_campaign};
	 
	  $.ajax({
		  url		:		this.options.el_apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( result ) {
			if(result.success == true) {
				  console.log (result.data);
				  this._setOption("category",result.data);
				  this._setOption("bucket",true)
				  //this._showDispositionsModal (result.data);
			  }else {
				  console.log (result);
			  }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
		  }, this));

  },

/* Added By Puja Gediya On 25/10/2018 For Checking users or agents callbacks */

  _listCallBacks : function()

  {
  	/*if (document.getElementById("modal_pause_codes")) {
		$("#modal_pause_codes").modal("show");
		return;
	}*/
	  	var params = {"api":"list_callbacks","campaign_id":this.options.VD_campaign,"agent_user":this.options.VD_login};
	  
	  	$.ajax({
		  url		:		this.options.el_apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( result ) {
			if(result.success == true && Object.keys(result.data).length > 0) {
				  console.log (result.data);
				  this._showCallBacksModal (result.data);
			  }else {
			  	alert("No callbacks Found.");
				  console.log (result);
				  return false;
			  }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
		  }, this));
  },

  _listDispositions: function() {
	  var params = {"api":"list_dispositions","campaign_id":this.options.VD_campaign};
	 
	  $.ajax({
		  url		:		this.options.el_apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( result ) {
			if(result.success == true) {
				  this._showDispositionsModal (result.data);
			  }else {
				  console.log (result);
			  }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
		  }, this));
  },
  _destroy: function () {},
 
 
  _setOption: function (key, value) {
	  this._super( key, value );
  },
  
  _showIngroupsModal: function (data) {
	  var html = "";
	  var show = 1;
	  var disable_blended_checkbox='0';	// set to 1 to disable the BLENDED checkbox from the in-group chooser screen
	  
	  html += '<form class="form-horizontal" onsubmit="return false;">';
	  $.each(data, function(index, ingroup) {
		  html += '<div class="checkbox">';
		  html += '<label> <input type="checkbox" class="ingroups" name="cb'+index+'" value="'+ingroup+'" /> ' + ingroup + ' </label>';
		  html += '</div>';
	  });
	  
	  if (data.length === 0) {
		  html += '<div class="alert alert-warning"> No Inbound process defined </div>';
		  show = 0;
	  }
	  
	  // Added By Puja Gediya On 27/09/2018 to show check box when user user have choose blended permission and dial methos is not INBOUND_MAN
	  //console.log(this.options.agent_choose_blended);

	  	if( (this.options.agent_choose_blended == 'Y') && (disable_blended_checkbox < 1) && (this.options.dial_method != "INBOUND_MAN") ) {

			html += '<hr/><div class="checkbox">';
			html += '<label> <input type="checkbox" name="blended" id="blended" value="blending" /> Blended Calling (Outbound Activated)  </label>';
			html += '</div>';
		}
	  
	  html += ' </form>';
	  this._modal ("modal_ingroups","Select Inbound Process","", "", html, "Save", show);
	  $(this.options.modal_ingroups).insertAfter(this.element);
	  $("#modal_ingroups").modal("show");
	  $("body").on("click","#select_all", function() { 
		  $(".ingroups").prop("checked", $("#select_all").is(":checked")); 
		  });
	  // set the onclick event for save button which is in modal
	  this._on( "#save_modal_ingroups", {
		  "click": this._saveIngroups,
		});
  },
  
  _showTransferCallModal: function (data) {
	  if (document.getElementById("modal_transfer_call")) {
		  //$("#modal_transfer_call").modal("show");
		  //return;
	  }
	  var html = "";
	  html += '<div class="row">';
	  html += '<form class="form-horizontal" onsubmit="return false;">';
	  html += '<div class="">';
	  html += '<div class="col-xs-4">';
	  html += '<div class="form-group>';
	  html += '<label for="txt-transfer-call">External number</label>';
	  html += '<input type="text" class="form-control" name="txt-transfer-call" id="txt-transfer-call" placeholder="Transfer call to">';
	  html += '</div>'; /* form-group */
	  /*
	  html += '<br/>';
	  html += '<div class="form-group>';
	  html += '<label for="did_transfer">Queue transfer</label>';
	  html += '<select class="form-control" name="did_transfer" id="did_transfer">';
	  $.each(this.options.dids, function(index, did) {
		  html += '<option value="'+index+'">'+did+'</option>';
	  });
	  html += '</select>';
	  html += '</div>';*/ /* form-group */
	  html += '</div>'; /* col-xs-6 */
	  
	  html += '<div class="col-xs-4">';
	  html += '<div class="form-group>';
	  html += '<label for="sel_ingroup">Internal transfer</label>';
	  html += '<select class="form-control" name="sel_ingroup" id="sel_ingroup">';
	  html += '<option value=""></option>';
	  $.each(this.options.xfergroups, function(index, xfergroup) {
		  html += '<option value="'+xfergroup+'">'+xfergroup+'</option>';
	  });
	  html += '</select>';
	  html += '</div>'; /* form-group */
	  html += '</div>'; /* col-xs-6 */
	  
	  html += '<div class="col-xs-4">';
	  html += '<div class="form-group>';
	  html += '<label for="sel_agent">Agent transfer <a href="javascript:void(0);" id="reload_agents" class="small mark" title="Click to reload live agents list" data-toggle="tooltip">Reload list</a></label>';
	  html += '<select class="form-control" name="sel_agent" id="sel_agent">';
	  html += '<option value=""></option>';
	  $.each(this.options.live_agents, function(index, agent) {
		  html += '<option value="'+agent["id"]+'">'+agent["name"]+'</option>';
	  });
	  html += '</select>';
	  html += '</div>'; /* form-group */
	  html += '</div>'; /* col-xs-6 */
	  
	  html += '</div>'; /* col-xs-12 */
	  
	  html += '<div class="col-xs-12">&nbsp;</div>';
	  
	  html += '<div class="col-xs-12">';
	  html += '<div class="btn-group btn-group-justified" role="group" aria-label="...">';
	  html += '<div class="btn-group" role="group">';
	  html += '<button type="button" class="btn btn-info" id="btn-blind-transfer">Blind Transfer</button>';
	  html += '</div>';
	  html += '<div class="btn-group" role="group">';
	  html += '<button type="button" class="btn btn-info" id="btn-dial-with-customer">Dial with customer</button>';
	  html += '</div>';
	  html += '<div class="btn-group" role="group">';
	  html += '<button type="button" class="btn btn-info" id="btn-park-customer-dial">Park customer dial</button>';
	  html += '</div>';
	  html += '<div class="btn-group" role="group">';
	  html += '<button type="button" class="btn btn-info" id="btn-internal-transfer">Internal transfer</button>';
	  html += '</div>';
	  html += '</div>';
	  html += '<div class="row">&nbsp;</div>';
	  html += '<div class="btn-group btn-group-justified" role="group" aria-label="...">';
	  html += '<div class="btn-group" role="group">';
	  html += '<button type="button" class="btn btn-danger" id="btn-leave-3-way-call" disabled="disabled">Leave 3-way call</button>';
	  html += '</div>';
	  html += '<div class="btn-group" role="group">';
	  html += '<button type="button" class="btn btn-danger" id="btn-hangup-x-fer-line" disabled="disabled">Hangup Xfer line</button>';
	  html += '</div>';
	  html += '<div class="btn-group" role="group">';
	  html += '<button type="button" class="btn btn-danger" id="btn-hangup-both-line" disabled="disabled">Hangup both line</button>';
	  html += '</div>'; /* btn-group */
	  html += '</div>';
	  html += ' </form>'; /* end of form */
	  html += '</div>'; /* col-xs-12 */
	  html += '</div>'; /* end of class row */
	  this._modal ("modal_transfer_call","Transfer Call","Dial external number or transfer to internal group or an agent", "", html, "Transfer", 1);
	  $(this.options.modal_transfer_call).insertAfter(this.element);
	  $("#modal_transfer_call").modal("show");
	  $("#reload_agents").tooltip();
	  this._on( "#reload_agents", {
		  "click": function(e) { this._listLiveAgents( "render" ); },
		});
	  this._on( "#btn-blind-transfer", {
		  "click": function(e) { this._transferCall( "blind-transfer" ); },
		});
	  this._on( "#btn-dial-with-customer", {
		  "click": function(e) { this._transferCall( "dial-with-customer" ); },
		});
	  this._on( "#btn-park-customer-dial", {
		  "click": function(e) { this._transferCall( "park-customer-dial" ); },
		});
	  this._on( "#btn-internal-transfer", {
		  "click": function(e) { this._transferCall( "internal-transfer" ); },
		});
	  this._on( "#btn-leave-3-way-call", {
		  "click": function(e) { this._transferCall( "leave-3-way-call" ); },
		});
	  this._on( "#btn-hangup-x-fer-line", {
		  "click": function(e) { this._transferCall( "hangup-x-fer-line" ); },
		});
	  this._on( "#btn-hangup-both-line", {
		  "click": function(e) { this._transferCall( "hangup-both-line" ); },
		});
	  
	  $("#sel_ingroup").on("change", function(){
		  var grp = $(this).val();
		  if(grp.length > 0) {
			  $("#alert-loading").html("Transfer to: " + grp).show();
			  $("#txt-transfer-call").attr("disabled","disabled");
			  $("#sel_agent").attr("disabled","disabled");
		  } else {
			  $("#alert-loading").hide();
			  $("#txt-transfer-call").removeAttr("disabled");
			  $("#sel_agent").removeAttr("disabled");
		  }
	  });
	  
	  $("#txt-transfer-call").on("keyup", function(e){
		  var num = $(this).val();
		  if(num.length > 1) {
			  $("#alert-loading").html("External transfer: " + num).show();
			  $("#sel_ingroup").attr("disabled","disabled");
			  $("#sel_agent").attr("disabled","disabled");
		  } else {
			  $("#alert-loading").hide();
			  $("#sel_ingroup").removeAttr("disabled");
			  $("#sel_agent").removeAttr("disabled");
		  }
	  });
	  
	  $("#sel_agent").on("change", function(){
		  var agn = $(this).val();
		  var selected_text = $("#sel_agent :selected").text();
		  if(agn.length > 0) {
			  $("#alert-loading").html("Transfer to: " + selected_text + "(" + agn + ")" ).show();
			  $("#txt-transfer-call").attr("disabled","disabled");
			  $("#sel_ingroup").attr("disabled","disabled");
		  } else {
			  $("#alert-loading").hide();
			  $("#txt-transfer-call").removeAttr("disabled");
			  $("#sel_ingroup").removeAttr("disabled");
		  }
	  });
  },
  
  _showPauseCodesModal: function (data) {
	  var html = "";
	  var i = 1;
	  html += '<table class="table table-condensed pause-codes borderless">';
	  $.each(data, function(index, pause_code) {
		  if( i == 1) { html += '<tr>';}
		  html += '<td style="border:none;"><input type="button" class="btn btn-link codes" data-code = "'+index+'" value="'+pause_code+'" /></td>';
		  if (i % 4 == 0) { html += '</tr><tr>'; }
		  i++;
	  });
	  html += '</table>';

	  /* -------------------------------------------------------------------------------------- */
	  /* Vinay - 17-05-2017 - 'modal-lg' added for 'Select Pause Code' modal instead of 'modal' */
	  /* -------------------------------------------------------------------------------------- */
	  this._modal ("modal_pause_codes","Select Pause Code","Double click to set pause code", "modal-lg", html, "set", 1);
	  $(this.options.modal_pause_codes).insertAfter(this.element);
	  
	  $("#modal_pause_codes").modal("show");
	  
	  this._on( ".codes", {
		  //"dblclick": this._savePauseCodes,
		  "dblclick": function(e) { 
			  	//alert($(e.currentTarget).attr("data-code")); console.log ($(e.currentTarget).attr("data-code"));
			  	$(e.currentTarget).attr("class","btn btn-info active codes");
			  	this._savePauseCodes( $(e.currentTarget).attr("data-code") );
			  },
		});
	  
	  this._on( ".codes", {
		  //"dblclick": this._savePauseCodes,
		  "click": function(e) { 
			  	//alert($(e.currentTarget).attr("data-code")); console.log ($(e.currentTarget).attr("data-code"));
			    $("input.codes").attr("class","btn btn-link codes");
			  	$(e.currentTarget).attr("class","btn btn-default active codes");
			  },
		});
	  
	  this._on( "#resume_calling", {
		  "click": this._startCalling,
		});
  },

  _showCallBacksModal: function(data)
  {
  	var html = "";
	  html += '<table class="table table-condensed pause-codes borderless">';
	  html += '<tr><th>Sr No.</th><th>Callback date/time</th><th>Number</th><th>Full Name</th><th>Status</th><th>Campaign</th><th>Last call date/time</th><th>Dial</th></tr>';
	  
	  $.each(data, function(index,callback) {
	 	
	 	var i = index+1;

	  	html += '<tr>';
	  	html += '<td>'+i+'</td>';
	  	$.each(callback, function(key,value) {

	  	if(key == 'phone_number'){
	  		html += '<td id=phone_'+i+'>'+value+'</td>';

	  	}else{
		html += '<td>'+value+'</td>';
		}

	  	});
		html += '<td><button type="button" data-phone=phone_'+i+' class="btn btn-info btn-dial" id="btn-dial">Dial</button></td>';

		html += '<tr>'; 
	  });
	  html += '</table>';

	  this._modal ("modal_callbacks","Call Back","", "modal-lg", html, "Transfer", 1);
	  $(this.options.modal_callbacks).insertAfter(this.element);
	  
	  $("#modal_callbacks").modal("show");

	  this._on( ".btn-dial", {
		  "click": function (e) { 
		  	
		  	 var id_manul = e.target.getAttribute('data-phone');
		  	var phonevalue = $.trim($('#'+id_manul).html());
		  
		  	this._manualCalling(phonevalue);
		  	 },
		});
	   
  },
  
  _showDispositionsModal: function (data) {

	if(this.options.bucket)
	{
  			var html = "<div class='tabbable tabbable-tabdrop'><ul class='nav nav-tabs'>";
  		var i = 1;
  		$.each(data, function(index, disposition) { 
  			var res = index.replace(" ", "_");
  			var str = res.toLowerCase() ;
  			console.log(str) ;
  			if( i == 1) 
  			{ html += "<li class='active'><a href='#"+str+"' data-toggle='tab'>"+index+"</a></li>";
  			}
  			else{
  				html += "<li><a href='#"+str+"' data-toggle='tab'>"+index+"</a></li>";
  			}
  			i++;
  		});

  		html = html + "</ul>";

  		html += '<div class="tab-content">';

  		var j = 1;
  		$.each(data, function(index, disposition) { 
  			var res = index.replace(" ", "_");
  			var str = res.toLowerCase() ;
  	
  			if( j == 1) 
  			{ 
  				html += '<div class="tab-pane active" id='+str+'>';
				  	var k = 1;
				  	html += '<table class="table table-condensed pause-codes borderless">';
  				$.each(disposition, function(index,status) { 
  					var dispo = status.split("-") ;
  					if( k == 1) { html += '<tr>';}
						html += '<td style="border:none;"><input type="button" class="btn btn-link disposition" data-disposition = "'+dispo[0]+'" value="'+dispo[1]+'" /></td>';
						if (k % 4 == 0) { html += '</tr><tr>'; }
					k++;
  				//category += status ;	
  				});
  				html += '</table>';
  				html += '</div>' ;
  			}
  			else{
  				html += '<div class="tab-pane" id='+str+'>' ;
  				var k = 1;
				  	html += '<table class="table table-condensed pause-codes borderless">';
  				$.each(disposition, function(index,status) { 
  					var dispo = status.split("-") ;
  					if( k == 1) { html += '<tr>';}
						html += '<td style="border:none;"><input type="button" class="btn btn-link disposition" data-disposition = "'+dispo[0]+'" value="'+dispo[1]+'" /></td>';
						if (k % 4 == 0) { html += '</tr><tr>'; }
					k++;
  				//category += status ;	
  				});
  				html += '</table>';
  				html += '</div>' ;
  			}
  			j++;
  		});
    	
  		html += '</div></div>' ;

  	}
  	else{
  		var html = "";
		var i = 1;
		html += '<table class="table table-condensed pause-codes borderless">';
		    $.each(data, function(index, disposition) { 
			    if( i == 1) { html += '<tr>';}
			    html += '<td style="border:none;"><input type="button" class="btn btn-link disposition" data-disposition = "'+index+'" value="'+disposition+'" /></td>';
			    if (i % 4 == 0) { html += '</tr><tr>'; }
			    i++;
		    });
		html += '</table>';
  	}
	  
	  this._modal ("modal_disposition","Select Disposition","Double click on dispostion", "modal-lg", html, "dispose", 1);
	  $(this.options.modal_disposition).insertAfter(this.element);
	  $("#modal_disposition").modal("show");
	  // set the onclick event for save button which is in modal
	  this._on( ".disposition", {
		  //"dblclick": this._savePauseCodes,
		  "dblclick": function(e) { 
			  	//alert($(e.currentTarget).attr("data-code")); console.log ($(e.currentTarget).attr("data-code"));
			  	$(e.currentTarget).attr("class","btn btn-info active disposition");
			  	this._saveDisposition( $(e.currentTarget).attr("data-disposition") );
			  },
		});
	  
	  this._on( ".disposition", {
		  //"dblclick": this._savePauseCodes,
		  "click": function(e) { 
			  	//alert($(e.currentTarget).attr("data-code")); console.log ($(e.currentTarget).attr("data-code"));
			    $("input.disposition").attr("class","btn btn-link disposition");
			  	$(e.currentTarget).attr("class","btn btn-default active disposition");
			  	
			  },
		});
  },
  
  _showManualDialModal: function () {
  	/* If "onhook" option is set to true then "ring" the agent as soon as he clicks on Manual Dial button */
	  //alert(this.options.onhook)
	  //if (this.options.onhook)
	  /* modified By Puja For Onhook call on 20/07/2017*/
	  if (this.options.onhook == '1')
	  {
	  	var params = {"api":"connect_phone","agent_user":this.options.VD_login};
		  $.ajax({
			  url		:		this.options.el_apiurl,
			  data		:		params,
			  type		:		"POST",
			  timeout	:		30000
			})
			.done($.proxy( function ( result ) {
				if(result.success == true) {
					  //this._showDispositionsModal (result.data);
				  }else {
					  console.log (result);
				  }
			  }, this))
			  .fail($.proxy( function ( error ) {
				  console.log(error);
				  //Rollbar.error("Error while calling URL: " + this.options.el_apiurl+" with params: "+ JSON.stringify(params) + " error log: " + JSON.stringify(error));
			  }, this));
	  }
	  var html = "";
	  html += '<form class="form-horizontal" onsubmit="return false;">';
	  html += '<div class="form-group>';
	  html += '<label for="manual-number">Enter number (with country code)</label>';
	  html += '<input type="text" class="form-control" id="manual-number" placeholder="Enter number">';
	  html += '<a href="javascript:void(0);" class="small tip" data-placement="left" data-toggle="tooltip" title="You should hear following message: \'You are currently the only person in this conference\' If you didn\'t hear the message then please close this dialog box, press hangup on your hard phone and try again">Help</a>';
	  html += '</div>';
	  html += ' </form>';
	  this._modal ("modal_manual_dial","Manual Dial","Outbound call", "modal-sm", html, "Dial", 1);
	  $(this.options.modal_manual_dial).insertAfter(this.element);
	  $("#modal_manual_dial").modal("show");
	  $("a.tip").tooltip();
	  // testing manual dial on hook
	  //this._agentSession("setoption");
	  //this._callAgent();
	  // set the onclick event for save button which is in modal
	  this._on( "#dial_modal_manual_dial", {
		  "click": function (e) { this._manualCalling(0); },
		});
	  /* this is for hangup button on manual dial modal
	  this._on( "#hangup_modal_manual_dial", {
		  "click": this._endManualCall,
		});
		*/
  },
  
  _showSessionTimeoutModal: function () {
	  if($('#modal_session_timeout').hasClass('in')) {
		  return false;
	  }
	  var html = "";
	  html += '<div class="alert alert-warning"> No one in your session</div>';
	  this._modal ("modal_session_timeout","Session Timeout","", "modal-sm", html, "Call", 1);
	  $(this.options.modal_session_timeout).insertAfter(this.element);
	  $("#modal_session_timeout").modal("show");
	  // set the onclick event for save button which is in modal
	  this._on( "#call_modal_session_timeout", {
		  "click": this._callAgent,
		});
	  /* this is for hangup button on manual dial modal
	  this._on( "#hangup_modal_manual_dial", {
		  "click": this._endManualCall,
		});
		*/
  },
  
  _showNotificationModal: function( content, alerttype, closebutton , relogin_agent) {
	  var html = "";
	  html += '<div class="alert alert-'+ alerttype.toLowerCase() +'">';
	  html += content;
	  html += '</div>';

	  // Added By Puja Gediya On 23/04/2018 For Relogin button 
		if(relogin_agent === true)
	  	{
	  		this._modal ("modal_notification","Notification","", "", html, "reloginagent", closebutton);
	  	}
	  	else{
	  		this._modal ("modal_notification","Notification","", "", html, "notification", closebutton);
	  	}
	  
	  	$(this.options.modal_notification).insertAfter(this.element);
	  	$("#modal_notification").modal("show");

	  	// Added By Puja Gediya On 23/04/2018 on click of relogin logout agent and relogin again
	  	this._on("#btn-relogin-agents", {
		  		"click": function(e) {
  			  			this.logout();
  			  			$("#modal_notification").modal("hide");
  			  				this._login();
		  					return true;
  			  	},
		});
  },
  
  _showDateTimePickerModal: function ( disposition ) {
	  var html = "";
	
	  html += '<form class="form-horizontal">';
	  html += '<div class="form-group">';
	  html += '<label for="txt-callback-time" class="col-sm-2 control-label">Date/Time</label>';
	  html += '<div class="col-sm-10">';
      html += '<input class="form-control callback-time"  type="text" value="" readonly id="txt-callback-time">';
      html += '</div></div>';
      
      html += '<div class="form-group">';
	  html += '<label for="txt-callback-comments" class="col-sm-2 control-label">Comments</label>';
	  html += '<div class="col-sm-10">';
      html += '<input class="form-control" type="text" value="" id="txt-callback-comments">';
      html += '</div></div>';
      
      
      html += '<div class="form-group">';
      html += '<div class="col-sm-offset-2 col-sm-10">';
      html += '<div class="checkbox">';
      html += '<label>';
      html += '<input type="checkbox" id="chk-callback-type"> User only';
      html += '</label>';
      html += '</div>';
      html += '</div>';
      html += '</div>';

	  
	  this._modal ("modal_datetimepicker","Select callback time","", "", html, "callbk", 1);
	  $(this.options.modal_datetimepicker).insertAfter(this.element);
	  
	  // get current time
	  var now = new Date(Date.now());
	  var formatted = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
	  
	  $(".callback-time").datetimepicker({
		  format: "yyyy-mm-dd+hh:ii:ss",
	      autoclose: true,
	      todayBtn: true,
	      pickerPosition: "bottom-left",
	      startDate: $.datepicker.formatDate('yy-mm-dd', new Date()) +" "+ formatted
	  });
	  $("#modal_datetimepicker").modal("show");
	  // set the onclick event for save button which is in modal
	  this._on( "#callbk_modal_datetimepicker", {
		  "click": function(e) {
			  var callback_datetime = $("#txt-callback-time").val();
			  if (callback_datetime.length === 0 ) { 
				  alert("Please select call back date time");
				  return false;
			  }
			  	$("#modal_datetimepicker").modal("hide");
			  	this._dispose( disposition );
			  //alert( $("#txt-callback-time").val() );
			  },
		});
  },
  
  _callAgent: function() {
	  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"call_agent", "value":"CALL"};
	 
	  $.ajax({
		  url		:		this.options.apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( data ) {
			console.log(data);
			 if (this._hasSuccess (data)) {
				 $("#modal_session_timeout").modal("hide");
			 }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
			  //Rollbar.error("Error while calling URL: " + this.options.apiurl+" with params: "+ JSON.stringify(params) + " error log: " + JSON.stringify(error));
		  }, this));
  },

 _dialNext: function() {
	 this._setOption("disable_pausecode", true);
	 this._setOption("dial_next", true);
	 this._stop();
	 $("#btn-start").attr("disabled","disabled");
  	 
  },
  
  _manualCalling: function ( num ) {
	  //external_dial&value=7275551212&phone_code=1&search=YES&preview=NO&focus=YES&dial_prefix=88&group_alias=DEFAULT
	  var clicktocall = false;
	  if (num === 0 ) {
		  var number = $("#manual-number").val();
		  $("#alert-loading").show();
	  } else {
	  	$("#modal_callbacks").modal("hide");
		var number = num;
		  //alert(number)
		  clicktocall = true;
	  }
	  if ($.isNumeric( number ) || number === "MANUALNEXT") {
		  //$("#dial_modal_manual_dial").attr("disabled","disabled");
		  
		  
	  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"external_dial", "value":number, "phone_code":1, "search": "YES", "preview":"NO", "focus":"NO","campaign_id":this.options.VD_campaign };

	  $.ajax({
		  url		:		this.options.apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( data ) {
			//alert(data);
			//console.log(data);
			 if (this._hasSuccess (data)) {
				 this._setOption("incall",1);
				 $("#modal_manual_dial").modal("hide");
				 $("#btn-stop").removeAttr("disabled");
				 $("#btn-start").attr("disabled","disabled");
				 $("#btn-dial-next").attr("disabled","disabled");
				 $("#dial_modal_manual_dial").attr("disabled","disabled");
				 $("#hangup_modal_manual_dial").removeAttr("disabled");
				 if( clicktocall ) {
					 $("#modal_notification").modal("hide");
				 }
			 }else {
				 $("#modal_manual_dial").modal("hide");
				 alert(data);
			 }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
			  //Rollbar.error("Error while calling URL: " + this.options.apiurl+" with params: "+ JSON.stringify(params) + " error log: " + JSON.stringify(error));
		  }, this));
	  } else {
		  alert("Not a valid number");
	  }
  },
  
  _endManualCall: function() {
	  $("#dial_modal_manual_dial").removeAttr("disabled");
	  $("#alert-loading").hide();
	  //alert(this.options.webform) ;
	  if(this.options.webform == '1'){
		  $("#webform").attr("disabled","disabled");
		  $("#webform").attr("href","javascript:void(0);");
		  this._setOption("webform_url_set",0); //reset webform url flag - vishal
	  }
	  this._hangup();
	  /* Vishal commenting following line out so it will not show disposition - 1 July 2016 */
	  /* If Bucket is active for campaign it will show bucket in disposion pop-up*/
	  if(this.options.bucket){
	  	this._showDispositionsModal (this.options.category);
	  }
	  else{
	  	this._listDispositions(); 
	  }
  },
  
  _startrecording:function() { 
	  $("#btn-start-recording").attr("disabled","disabled");
	  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"recording", "value":"START"};
	  
	  $.ajax({
		  url		:		this.options.apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( data ) {
			console.log(data);
			 if (this._hasSuccess (data)) {
				 this._setOption("recording", 1);
				 $("#btn-stop-recording").removeAttr("disabled");
			 } else {
				 this._setOption("recording", 0);
				 $("#btn-start-recording").removeAttr("disabled");
			 }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
		  }, this));
  },
  _stoprecording: function(){ 
	  $("#btn-stop-recording").attr("disabled","disabled");
	  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"recording", "value":"STOP"};
	  
	  $.ajax({
		  url		:		this.options.apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( data ) {
			console.log(data);
			 if (this._hasSuccess (data)) {
				 this._setOption("recording", 0);
				 $("#btn-start-recording").removeAttr("disabled");
			 } else {
				 this._setOption("recording", 1);
				 $("#btn-stop-recording").removeAttr("disabled");
			 }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
		  }, this));
  },
  _startCalling: function () {
	  $("#btn-start").attr("disabled","disabled");
	  //$("#btn-dial-next").attr("disabled","disabled");
	  $("#btn-manual-dial").attr("disabled","disabled");
	  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"external_pause", "value":"RESUME"};
	  
	  $.ajax({
		  url		:		this.options.apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( data ) {
			console.log(data);
			 if (this._hasSuccess (data)) {
				 $("#btn-stop").removeAttr("disabled");
			 } else {
				 $("#btn-start").removeAttr("disabled");
				 $("#btn-manual-dial").removeAttr("disabled");
			 }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
			  //Rollbar.error("Error while calling URL: " + this.options.apiurl+" with params: "+ JSON.stringify(params) + " error log: " + JSON.stringify(error));
		  }, this));
  },
  _stop: function() {
//	  var pause = confirm("Are you sure you want to pause?");
//	  if (pause == true) {
//		  this._stopCalling();
//		  this._listPauseCodes();
//	  } else {
//	      return false;
//	  }
	  this._stopCalling();
	  /* commented by vishal on 11 july 2016 as sometimes it should agent not paused error - 
	   * moved to stopcalling function .done method 
	   * */
	  /* this._listPauseCodes(); */ 
  },
  _stopCalling: function () {
	  	$("#btn-stop").attr("disabled","disabled");
		//alert('okk');
	  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"external_pause", "value":"PAUSE"};
	 
	  $.ajax({
		  url		:		this.options.apiurl,
		  data		:		params,
		  type		:		"POST",
		  async     :       false ,
		  timeout	:		15000
		})
		.done($.proxy( function ( data ) {
			console.log(data);
			 if (this._hasSuccess (data)) {
				 $("#btn-start").removeAttr("disabled");
				 $("#btn-manual-dial").removeAttr("disabled");
				 if (!this.options.disable_pausecode) {
					 this._listPauseCodes();
				 } else {
					 this._setOption("disable_pausecode", false);
					 if (this.options.dial_next) {
						 // sleep 1 second
						 sleep(1000).then(() => {
							 this._manualCalling("MANUALNEXT");
						 });
						 
						 // Added By Puja Gediya On 24/04/2018  
						function sleep (time) {
							  return new Promise((resolve) => setTimeout(resolve, time));
						}
					 }
					 
				 }
			 } else{
				 $("#btn-stop").removeAttr("disabled");
				 $("#btn-manual-dial").attr("disabled","disabled");
				 $("#btn-start").attr("disabled","disabled");
				 alert(data);
			 }
		  }, this))
  },
  _hangup: function() {
		
	  //this._stopCalling();
	  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"external_hangup", "value":1};
	 
	  $.ajax({
		  url		:		this.options.apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( data ) {
			console.log(data);
			 if (this._hasSuccess (data)) {
				 console.log(data);
				 $("#hangup_modal_manual_dial").attr("disabled","disabled");
				 this._setOption("incall",0);
				 this._setOption("call_id",0);
				 $("#dial_modal_manual_dial").removeAttr("disabled");
			 }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
			  //Rollbar.error("Error while calling URL: " + this.options.apiurl+" with params: "+ JSON.stringify(params) + " error log: " + JSON.stringify(error));
		  }, this));
  },
  
  _dispose: function( disposition ) {
	  $("#modal_disposition").modal("hide");
	  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"external_status", "value":disposition};
	  //if ( disposition === "CALLBK" ) {

	  	if(this.options.campaign_callback == 'Y')
	  	{

		  var comments = $("#txt-callback-comments").val();
		  var callback_comments = comments.replace(/\s/g, '+'); //replace space with plus sign
		  var callback_datetime = $("#txt-callback-time").val();
		  
		  var callback_type = "ANYONE";
		  if( $("#chk-callback-type").is(":checked") ) {
			  var callback_type = "USERONLY";
		  }
		  
		  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"external_status", "value":disposition, "callback_datetime":callback_datetime, "callback_type":callback_type,"callback_comments":callback_comments};  
		} 
	  
	 //}
	  $.ajax({
		  url		:		this.options.apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( data ) {
			console.log(data);
			 if (this._hasSuccess (data)) {
				 // pause agent
				 if ( $("#pause_agent").is(":checked") ) { 
					 this._stop();
				 }
				 // Added By Puja Gediya On 19/07/2018 as if pause agent checkbox is not checked then resume agent 
				 else{
				 	this._startCalling();
				 }
			 } else {
				 alert("Error while disposing call: " + data);
			 }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
		  }, this));
  },
  _parkGrabCall: function() {
	  if( this.options.incall === 0 ) {
		  console.log ("Can not park offline call - You are not in call!");
		  this._showNotificationModal ("ERROR: Can not park offline call - You are not in call!", "danger", true);
		  return false;
	  }
	  var button = $("#btn-park-call");
	  button.attr("disabled","disabled");
	  var current = button.attr("data-toggle");
	  switch (current)
	  {
	  	case "park":
	  		button.html ("Grab Call");
	  		button.attr("data-toggle","grab");
	  		
	  		var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"park_call", "value":"PARK_CUSTOMER"};
	  		$.ajax({
	  			type : "POST",
	  			url  : this.options.apiurl,
	  			data : params,	
	  		}).done ($.proxy(function( data ) {
	  			 console.log(data);
	  			 if (this._hasSuccess (data)) {
	  				 console.log(data);
	  				button.removeAttr("disabled");
	  				$("#btn-hangup").attr("disabled","disabled");
	  			 }
	  		  }, this))
	  		break;
	  		
	  	case "grab":
	  		button.html ("Park");
	  		button.attr("data-toggle","park");
	  		
	  		var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"park_call", "value":"GRAB_CUSTOMER"};
	  		$.ajax({
	  			type : "POST",
	  			url  : this.options.apiurl,
	  			data : params,	
	  		}).done ($.proxy(function( data ) {
	  			 console.log(data);
	  			 if (this._hasSuccess (data)) {
	  				 console.log(data);
	  				button.removeAttr("disabled");
	  				// hardware hangup - vishal testing
	  				$("#btn-hangup").removeAttr("disabled");
	  				//$("#btn-hangup").attr("disabled","disabled");
	  			 }
	  		  }, this))
	  		break;
	  		
	  	default:
	  		break;
	  }
	  
  },
  
  _transferCall: function( action ) {
	  
	  if (action != "leave-3-way-call" && action != "hangup-x-fer-line" && action != "hangup-both-line")
		  {
			  var phone_number = "";
			  phone_number = $("#txt-transfer-call").val(); 
			  var new_number = phone_number.trim();
			  phone_number = new_number;
			  
			  // check if phone number is undefined
			  if (phone_number === "undefined") {
				  phone_number = ""; 
			  }
			  
			  var ingroup_choices = $("#sel_ingroup :selected").text();
			  var agent_transfer = $("#sel_agent").val();
			  if (ingroup_choices.length == 0 && phone_number.length == 0 && agent_transfer.length == 0) {
				  alert("Please enter a number or select the transfer group or select agent");
				  return false;
			  }
			  
			  if (ingroup_choices.length != 0 && (action == "dial-with-customer" || action == "park-customer-dial" || action == "internal-transfer" || action == "blind-transfer")) {
				  // you are doing internal transfer with consultative option set to yes
				  console.log(ingroup_choices);
			  } 
			  else if (agent_transfer.length != 0 && (action == "dial-with-customer" || action == "park-customer-dial" || action == "internal-transfer" || action == "blind-transfer")) {
				  // you are doing agent transfer with consultative option set to yes
				  console.log(agent_transfer);
			  }
			  else if ( (phone_number.length  < 5 || $.isNumeric (phone_number) === false) ) {
				  alert ("Not a valid external number. Use agent or ingroup transfer if you are doing internal transfer.");
				  return false;
			  }
		  }
	  switch ( action )
	  {
		  case "blind-transfer":
			  $("#btn-select-transfer").html("Blind Transfer <span class='caret'></span>");
			  $("#alert-loading").show();
			  $("#btn-leave-3-way-call").attr("disabled","disabled");
			  $("#btn-hangup-x-fer-line").attr("disabled","disabled");
			  $("#btn-hangup-both-line").attr("disabled","disabled");
			  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"transfer_conference", "value":"BLIND_TRANSFER","phone_number": phone_number};
			  break;
			  
		  case "dial-with-customer":
			  $("#btn-select-transfer").html("Dial with customer <span class='caret'></span>");
			  $("#alert-loading").show();
			  $("#btn-leave-3-way-call").attr("disabled","disabled");
			  $("#btn-hangup-x-fer-line").attr("disabled","disabled");
			  $("#btn-hangup-both-line").attr("disabled","disabled");
			  if (ingroup_choices.length != 0) {
				  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"transfer_conference", "value":"DIAL_WITH_CUSTOMER","ingroup_choices": ingroup_choices, "consultative": "YES"};
			  } else if (agent_transfer.length != 0) {
				  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"transfer_conference", "value":"DIAL_WITH_CUSTOMER","phone_number": agent_transfer, "ingroup_choices": "AGENTDIRECT", "consultative": "YES", "dial_override": "YES"};
			  } else {
				  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"transfer_conference", "value":"DIAL_WITH_CUSTOMER","phone_number": phone_number, "dial_override": "NO"};
			  }
			  var msg = $("#alert-loading").html();
			  $("#alert-loading").html(msg + " <br/> using Dial with customer - Initiated").show();
			  break;
		  	
		  case "park-customer-dial":
			  var park_grab = $("#btn-park-customer-dial").data("action");
			  if (park_grab == "park") {
				  $("#btn-park-customer-dial").data("action","grab");
				  $("#btn-park-customer-dial").html("Grab customer");
				  
				  $("#btn-select-transfer").html("Park customer dial <span class='caret'></span>");
				  $("#alert-loading").show();
				  $("#btn-leave-3-way-call").attr("disabled","disabled");
				  $("#btn-hangup-x-fer-line").attr("disabled","disabled");
				  $("#btn-hangup-both-line").attr("disabled","disabled");
				  if (ingroup_choices.length != 0) { 
					  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"transfer_conference", "value":"PARK_CUSTOMER_DIAL","ingroup_choices": ingroup_choices, "consultative": "YES"};
				  }  else if (agent_transfer.length != 0) {
					  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"transfer_conference", "value":"PARK_CUSTOMER_DIAL","phone_number": agent_transfer, "ingroup_choices": "AGENTDIRECT", "consultative": "YES","dial_override": "YES"};
				  } else {
					  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"transfer_conference", "value":"PARK_CUSTOMER_DIAL","phone_number": phone_number};
				  }
				  var msg = $("#alert-loading").html();
				  $("#alert-loading").html(msg + " <br/> using Park customer dial - Initiated").show();
				  
			  } else {
				  $("#btn-park-customer-dial").data("action","park"); 
				  $("#btn-park-customer-dial").html("Park customer dial");
				  // park_grab - Vishal - 29 May 2017
				  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"park_call", "value":"GRAB_CUSTOMER"};
					 
			  }
			 
			  break;
			  
		  case "internal-transfer":
			  //$("#btn-select-transfer").html("Blind Transfer <span class='caret'></span>");
			  $("#alert-loading").show();
			  $("#btn-leave-3-way-call").attr("disabled","disabled");
			  $("#btn-hangup-x-fer-line").attr("disabled","disabled");
			  $("#btn-hangup-both-line").attr("disabled","disabled");
			  var ingroup_choices = $("#sel_ingroup :selected").text();
			  if(ingroup_choices.length === 0) { 
				  alert("Select ingroup"); 
				  return false; 
			  }
			  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"transfer_conference", "value":"LOCAL_CLOSER","ingroup_choices": ingroup_choices};
			  break;
			  
		  case "leave-3-way-call":
			  $("#alert-loading").hide();
			  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"transfer_conference", "value":"LEAVE_3WAY_CALL"};
			  
			  $("#alert-loading").html("Leave 3 Way Call - Initiated").show();
			  break;
			  
		  case "hangup-x-fer-line":
			  $("#alert-loading").hide();
			  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"transfer_conference", "value":"HANGUP_XFER"};
			  $("#alert-loading").html("Hangup transfer line - Initiated").show();
			  break;
			  
		  case "hangup-both-line":
			  $("#alert-loading").hide();
			  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"transfer_conference", "value":"HANGUP_BOTH"};
			  $("#alert-loading").html("Hangup both lines - Initiated").show();
			  break;
			  
		  default:
			  break;
	  }
	  
	  $.ajax({
			type : "POST",
			url  : this.options.apiurl,
			data : params,	
		}).done ($.proxy(function( data ) {
			 console.log(data);
			 if (this._hasSuccess (data)) {
				 console.log(data);
				 //$("#alert-loading").hide();
				 switch (action)
				 {
				 	case "blind-transfer":
				 		 $("#modal_transfer_call").modal("hide");
				 		 this._endManualCall();
				 		break;
				 		
				 	case "internal-transfer":
				 		 $("#modal_transfer_call").modal("hide");
				 		 this._endManualCall();
				 		break;
				 	
				 	case "dial-with-customer":
				 		$("#btn-leave-3-way-call").removeAttr("disabled");
						$("#btn-hangup-x-fer-line").removeAttr("disabled");
						$("#btn-hangup-both-line").removeAttr("disabled");
						$("#btn-dial-with-customer").attr("disabled","disabled");
						$("#btn-park-customer-dial").attr("disabled","disabled");
						$("#btn-blind-transfer").attr("disabled","disabled");
						$("#alert-loading").hide();
				 		break;
				 		
				 	case "park-customer-dial":
				 		$("#btn-leave-3-way-call").removeAttr("disabled");
						$("#btn-hangup-x-fer-line").removeAttr("disabled");
						$("#btn-hangup-both-line").removeAttr("disabled");
						$("#alert-loading").hide();
				 		break;
				 		
				 	case "leave-3-way-call":
				 		$("#btn-leave-3-way-call").attr("disabled","disabled");
						$("#btn-hangup-x-fer-line").attr("disabled","disabled");
						$("#btn-hangup-both-line").attr("disabled","disabled");
						$("#modal_transfer_call").modal("hide");
						//this._endManualCall(); 
						this._listDispositions();
						//asdfadf
						
				 		break;
				 		
				 	case "hangup-x-fer-line":
				 		$("#btn-leave-3-way-call").attr("disabled","disabled");
						$("#btn-hangup-x-fer-line").attr("disabled","disabled");
						$("#btn-hangup-both-line").removeAttr("disabled");
						$("#btn-dial-with-customer").removeAttr("disabled");
						$("#btn-park-customer-dial").removeAttr("disabled");
						$("#alert-loading").hide();
				 		break;
				 		
				 	case "hangup-both-line":
				 		$("#btn-leave-3-way-call").attr("disabled","disabled");
						$("#btn-hangup-x-fer-line").attr("disabled","disabled");
						$("#btn-hangup-both-line").attr("disabled","disabled");
						$("#modal_transfer_call").modal("hide");
						this._endManualCall();
				 		break;
				 		
				 	default:
				 		break;
				 }
			 } else {
				 alert (data);
			 }
		  }, this))
	  
  },

  
  _modal: function ( id, title, helptext, size, content, button, show ) {
	  	var modal = "";
		modal = modal + '<div class="modal" tabindex="-1" role="dialog" id="'+id+'" data-keyboard="false" data-backdrop="static">';
		modal = modal + '<div class="modal-dialog '+ size +'">';
		modal = modal + '<div class="modal-content">';
		modal = modal + '<div class="modal-header">';

		if( id === "modal_disposition" ) {
		modal = modal + '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
		}
		
		modal = modal + '<h4 class="modal-title">'+ title +'  <mark class="small">'+helptext+'</mark></h4>';
		modal = modal + '</div>';
		modal = modal + '<div class="modal-body">';
		modal = modal + '<div class="alert alert-info" id="alert-loading" style="display:none;">Call in progress, please wait ... </div>';
		modal = modal + content;
		modal = modal + '</div>';
		modal = modal + '<div class="modal-footer">';
		
		//console.log(button);
		//modal = modal + '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
		if(button.length > 0) {
			switch ( button.toLowerCase() )
			{
				case "login":
					modal = modal + '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
					break;
					
				case "save":
					if( id === "modal_ingroups" ) {
						modal = modal + '<div class="checkbox pull-left">';
						modal = modal + '<label> <input type="checkbox" name="select_all" id="select_all" value="pause_agent" /> Select all inbound groups</label>';
						modal = modal + '</div>';
					}
					if (show) {
						modal = modal + '<button type="button" class="btn btn-primary" id="save_'+id+'">Save</button>';
					}
					modal = modal + '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
					break;
					
				case "dial":
					modal = modal + '<button type="button" class="btn btn-primary" id="dial_'+id+'">Dial</button>';
					//modal = modal + '<button type="button" class="btn btn-danger" id="hangup_'+id+'" disabled="disabled">Hangup</button>';
					modal = modal + '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
					break;
					
				case "call":
					modal = modal + '<button type="button" class="btn btn-primary" id="call_'+id+'">Call</button>';
					//modal = modal + '<button type="button" class="btn btn-danger" id="hangup_'+id+'" disabled="disabled">Hangup</button>';
					modal = modal + '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
					break;
					
				case "set":
					modal = modal + '<button type="button" class="btn btn-success" id="resume_calling" data-dismiss="modal">Resume Calling</button>';
					//modal = modal + '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
					break;
					
				case "callbk":
					modal = modal + '<button type="button" class="btn btn-primary" id="callbk_'+id+'">Set Call Back</button>';
					//modal = modal + '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
					break;
					
				case "dispose":
					modal = modal + '<div class="checkbox pull-left">';
					modal = modal + '<label> <input type="checkbox" name="pause_agent" id="pause_agent" value="pause_agent" /> Pause agent  </label>';
					modal = modal + '</div>';
					//modal = modal + '<button type="button" class="btn btn-primary" id="save_'+id+'">Dispose</button>';
					break;
					
				case "transfer":
				//	modal = modal + '<button  class="btn btn-danger"  id="btn-leave-3-way-call">Leave 3-way call</button>';
				//	modal = modal + '<button  class="btn btn-danger"  id="btn-hangup-x-fer-line">Hangup Xfer Line</button>';
					
				//	modal = modal + '<div class="btn-group">';
					//modal = modal + '<button type="button" class="btn btn-danger">Select Transfer</button>';
				//	modal = modal + '<button type="button" id="btn-select-transfer" class="btn btn-info dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">';
				//	modal = modal + 'Transfer <span class="caret"></span>';
					//modal = modal + '<span class="sr-only">Toggle Dropdown</span>';
				//	modal = modal + '</button>';
				//	modal = modal + '<ul class="dropdown-menu">';
				//	modal = modal + '<li><a href="javascript:void(0);" id="btn-blind-transfer">Blind Transfer</a></li>';
				//	modal = modal + '<li><a href="javascript:void(0);" id="btn-dial-with-customer">Dial with customer</a></li>';
				//	modal = modal + '<li><a href="javascript:void(0);" id="btn-park-customer-dial">Park customer dial</a></li>';
					
				//	modal = modal + '</ul>';
				//	modal = modal + '</div>';
//					modal = modal + '<button type="button" class="btn btn-primary" id="btn-blind-transfer">Blind Transfer</button>';
//					modal = modal + '<button type="button" class="btn btn-primary" id="btn-dial-with-customer">Dial with customer</button>';
//					modal = modal + '<button type="button" class="btn btn-primary" id="btn-park-customer-dial">Park customer dial</button>';
//					modal = modal + '<button type="button" class="btn btn-primary" id="btn-leave-3-way-call">Leave 3-way call</button>';
//					modal = modal + '<button type="button" class="btn btn-primary" id="btn-hangup-x-fer-line">Hangup Xfer Line</button>';
					modal = modal + '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
					break;
					
				case "notification":
					modal = modal + '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
					break;

				// Added By Puja Gediya On 23/04/2018 on click of relogin logout agent and relogin again
					
				case "reloginagent":	
				    modal = modal + '<button type="button" class="btn btn-default" id="btn-relogin-agents">Relogin</button>';	
					modal = modal + '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
					break;

				default:
					break;
			}
		}
		modal = modal + '</div>';
		modal = modal + '</div><!-- /.modal-content -->';
		modal = modal + '</div><!-- /.modal-dialog -->';
		modal = modal + '</div><!-- /.modal -->';
		
		this._setOption (id, modal);
  },
  
  _saveIngroups: function () {
	  var selected = "";
	  $("input:checkbox[class=ingroups]:checked").each(function(){
		   selected += ' ' + $(this).val();
		});

	  // none selected is also allowed
	  if (selected.length >= 0) {
		  selected += ' -';
		  var blended = "YES";
		  if (this.options.dial_method === "INBOUND_MAN") {
			  blended = "NO";
		  }
		  
		  var blend = $("#blended").is(":checked");
		  var blended = "NO";
		  if(blend) {
			  blended = "YES";
		  }
		  
		  $("#modal_ingroups").modal("hide");
		  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"change_ingroups", "value":"CHANGE","blended":blended, "ingroup_choices": selected};
		 
		  $.ajax({
			  url		:		this.options.apiurl,
			  data		:		params,
			  type		:		"POST",
			  timeout	:		30000
			})
			.done($.proxy( function ( data ) {
				console.log(data);
				 if (this._hasSuccess (data)) {
					 selected = "";
				 } else {
					 alert("NOTE" + data);
				 }
			  }, this))
			  .fail($.proxy( function ( error ) {
				  console.log(error);
				  //Rollbar.error("Error while calling URL: " + this.options.apiurl+" with params: "+ JSON.stringify(params) + " error log: " + JSON.stringify(error));
			  }, this));
	  } else {
		  return true;
		  //alert ("Please select inbound groups");
	  }
  },
  _savePauseCodes: function( selected ) {
//	  var selected = "";
//	  selected = $("input:radio[name=pause-codes]:checked").val();
//	  if (typeof selected === "undefined") {
//		  alert ("Please select pause code");
//	  }
	  if (selected.length > 0) {
		  $("#modal_pause_codes").modal("hide");
		  var params = {"source": "api", "user":this.options.apiuser, "pass":this.options.apipass, "agent_user":this.options.VD_login, "function":"pause_code", "value":selected};
		 
		  $.ajax({
			  url		:		this.options.apiurl,
			  data		:		params,
			  type		:		"POST",
			  timeout	:		30000
			})
			.done($.proxy( function ( data ) {
				console.log(data);
				 if (this._hasSuccess (data)) {
					 selected = "";
				 } else {
					 //alert("Error while setting pause code: " + data);
					 console.log (data);
				 }
			  }, this))
			  .fail($.proxy( function ( error ) {
				  console.log(error);
				  $("#btn-ping-status").show();
				  $("#btn-ping-status").html('Alert: Network is flaky.');
				  //Rollbar.error("Error while calling URL: " + this.options.apiurl+" with params: "+ JSON.stringify(params) + " error log: " + JSON.stringify(error));
			  }, this));
		  
	  } else {
		  alert ("Please select pause code");
	  } 
  },
  _saveDisposition: function( selected ) {
//	  var selected = "";
//	  selected = $("input:radio[name=disposition]:checked").val();
//	  if (typeof selected === "undefined") {
//		  alert ("Please select disposition");
//	  }
	 // if( selected === "CALLBK" ) {

	  	// Added By Puja

	  	var params = {"api":"check_campaign_callback","campaign_id":this.options.VD_campaign,"status":selected};
	  
			  $.ajax({
				  url		:		this.options.el_apiurl,
				  data		:		params,
				  type		:		"POST",
				  timeout	:		30000
				})
				.done($.proxy( function ( result ) {
					console.log (result);
					this._setOption("campaign_callback",result.data)
					if(result.success == true && result.data == "Y") {
						  	this._showDateTimePickerModal(selected);
		  					$("#modal_disposition").modal("hide");
		  					return;
					  }else {
						  console.log (result);
					  }
				  }, this))
				  .fail($.proxy( function ( error ) {
					  console.log(error);
					  //Rollbar.error("Error while calling URL: " + this.options.el_apiurl+" with params: "+ JSON.stringify(params) + " error log: " + JSON.stringify(error));
				  }, this));


		  
	  //}

	  if (selected.length > 0) {
		  this._dispose ( selected );
	  } else {
		  alert ("Please select disposition");
	  } 
  },
  
  _validate: function ( options ) {
	// Check all mandatory fields has a value
		$.each(options, function(index,val){
			if( val.trim().length == 0 ) {
				console.log(index + " is missing in dialer login function.");
				throw new Error(index + " is missing in dialer login function.");
				return this;
			}
		});
  },
  _allowedManualDial: function() {
	  var params = {"api":"allowed_manual_dial","agent_user":this.options.VD_login};
	  
	  $.ajax({
		  url		:		this.options.el_apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( result ) {
			if(result.success == true && result.data === "1") {
				  this._addButton("manual-dial");
			  }else {
				  console.log (result);
			  }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
			  //Rollbar.error("Error while calling URL: " + this.options.el_apiurl+" with params: "+ JSON.stringify(params) + " error log: " + JSON.stringify(error));
		  }, this));
  },
  // Added By Puja Gediya On 27/09/2018 To check whether agent have permission to choose blended or not
  _allowedChooseBlended: function() {
	  var params = {"api":"allowed_choose_blended","agent_user":this.options.VD_login};
	  
	  $.ajax({
		  url		:		this.options.el_apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( result ) {
			 console.log (result);
			if(result.success == true && result.data === "1") {
				  	this._setOption("agent_choose_blended","Y");
			  }else {
			  		this._setOption("agent_choose_blended","N");
				  console.log (result);
			  }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
			  //Rollbar.error("Error while calling URL: " + this.options.el_apiurl+" with params: "+ JSON.stringify(params) + " error log: " + JSON.stringify(error));
		  }, this));
  },
  _checkCampaignRecording: function() {
	  var params = {"api":"campaign_recording","campaign_id":this.options.VD_campaign};
	  $.ajax({
		  url		:		this.options.el_apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( result ) {
			if(result.success == true && result.data === "ONDEMAND") {
				 this._addButton("stop-recording");
				 this._addButton("start-recording");
			  }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
			  //Rollbar.error("Error while calling URL: " + this.options.el_apiurl+" with params: "+ JSON.stringify(params) + " error log: " + JSON.stringify(error));
		  }, this));
  },
    _checkDialMethod: function() {
    	//alert(this.options.VD_campaign)
	  var params = {"api":"dial_method","campaign_id":this.options.VD_campaign};
	  $.ajax({
		  url		:		this.options.el_apiurl,
		  data		:		params,
		  type		:		"POST",
		  timeout	:		30000
		})
		.done($.proxy( function ( result ) {
			//alert(result.success)
			if(result.success == true && result.data === "RATIO") {
				  this._addButton("stop");
				  this._addButton("start");
				  this._setOption("dial_method","RATIO")
			  }else if(result.success == true && result.data === "INBOUND_MAN") {
				  this._addButton("stop");
				  this._addButton("start");
				  this._addButton("dial-next");
				  this._setOption("dial_method","INBOUND_MAN")
			  }else {
				   this._addButton("dial-next");
				   this._setOption("dial_method","MANUAL")
			  }
		  }, this))
		  .fail($.proxy( function ( error ) {
			  console.log(error);
			  //Rollbar.error("Error while calling URL: " + this.options.el_apiurl+" with params: "+ JSON.stringify(params) + " error log: " + JSON.stringify(error));
		  }, this));
  },
  _hasSuccess: function ( str ) {
	  if (str.substr(0,7).toLowerCase() == "success") {
		  return true;
	  }
	  return false;
  }
});
